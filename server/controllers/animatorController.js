import cloudinary from '../config/cloudinary.js';
import File from '../models/File.js';

export const saveVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided.' });

    // Upload to Cloudinary as video
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `kolomflow/users/${req.user._id}/animator`,
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
