import cloudinary from '../config/cloudinary.js';
import { prisma } from '../config/db.js';
import { deductCredits } from '../utils/creditManager.js';

export const saveVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided.' });
    const userId = req.user.id || req.user._id;

    // Upload to Cloudinary as video
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `waveword-ai/users/${userId}/animator`,
      resource_type: 'video',
      public_id: `animation_${Date.now()}`
    });

    // Save to Library
    const newFile = await prisma.file.create({
      data: {
        userId: userId,
        toolSource: 'animator',
        fileName: `Writing_Animation_${Date.now()}.mp4`,
        fileUrl: result.secure_url,
        fileType: 'mp4',
        size: result.bytes
      }
    });

    await deductCredits(userId, 15, 'animator', 'Generated Writing Animation');

    res.status(200).json({ 
      status: 'success', 
      url: result.secure_url,
      file: newFile
    });

  } catch (error) {
    console.error('Video Upload Error:', error);
    res.status(500).json({ error: 'Failed to save video animation.' });
  }
};
