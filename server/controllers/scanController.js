import cloudinary from '../config/cloudinary.js';
import { prisma } from '../config/db.js';
import { deductCredits } from '../utils/creditManager.js';

export const enhanceDocument = async (req, res) => {
  try {
    const { image, settings } = req.body; // base64 or url
    const { contrast, brightness, grayscale } = settings || { contrast: 100, brightness: 100, grayscale: 0 };
    const userId = req.user.id || req.user._id;

    if (!image) return res.status(400).json({ error: 'No image provided.' });

    // Apply Cloudinary AI transformations
    // e_improve: automatic color and contrast improvement
    // e_restore: AI restoration for old/damaged photos
    // e_sharpen: sharpen edges
    const transformation = [
      { effect: 'improve' },
      { effect: 'restore' },
      { effect: 'sharpen:100' },
      { contrast: contrast - 100 }, // Cloudinary contrast is relative
      { brightness: brightness - 100 }
    ];

    if (grayscale > 50) {
      transformation.push({ effect: 'grayscale' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: `waveword-ai/users/${userId}/scan`,
      transformation
    });

    // Save to library
    const newFile = await prisma.file.create({
      data: {
        userId: userId,
        toolSource: 'scan',
        fileName: `Restored_${Date.now()}.jpg`,
        fileUrl: result.secure_url,
        fileType: 'jpg',
        size: result.bytes
      }
    });

    await deductCredits(userId, 5, 'scan', 'Enhanced scanned document');

    res.status(200).json({ 
      status: 'success', 
      url: result.secure_url,
      file: newFile
    });

  } catch (error) {
    console.error('Enhancement Error:', error);
    res.status(500).json({ error: 'AI Restoration failed. Please try again.' });
  }
};
