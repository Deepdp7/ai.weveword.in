import cloudinary from '../config/cloudinary.js';
import File from '../models/File.js';
import { deductCredits } from '../utils/creditManager.js';

export const saveVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided.' });

    // Upload to Cloudinary as video
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `waveword-ai/users/${req.user._id}/animator`,
      resource_type: 'video',
      public_id: `animation_${Date.now()}`
    });

    // Save to Library
    const newFile = await File.create({
      userId: req.user._id,
      toolSource: 'animator',
      fileName: `Writing_Animation_${Date.now()}.mp4`,
      fileUrl: result.secure_url,
      fileType: 'mp4',
      size: result.bytes
    });

    await deductCredits(req.user._id, 15, 'animator', 'Generated Writing Animation');

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
