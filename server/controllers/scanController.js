import cloudinary from '../config/cloudinary.js';
import File from '../models/File.js';

export const enhanceDocument = async (req, res) => {
  try {
    const { image, settings } = req.body; // base64 or url
    const { contrast, brightness, grayscale } = settings || { contrast: 100, brightness: 100, grayscale: 0 };

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
      folder: `kolomflow/users/${req.user._id}/scan`,
      transformation
    });

    // Save to library
    const newFile = await File.create({
      userId: req.user._id,
      toolSource: 'scan',
      fileName: `Restored_${Date.now()}.jpg`,
      fileUrl: result.secure_url,
      fileType: 'jpg',
      size: result.bytes
    });

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
