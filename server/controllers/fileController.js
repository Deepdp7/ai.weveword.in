import FileModel from '../models/File.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { getFileType } from '../middleware/uploadMiddleware.js';

// @desc    Upload a file to Cloudinary & save metadata
// @route   POST /api/files/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file provided.' });
    }

    const { toolSource } = req.body;
    if (!toolSource) {
      return res.status(400).json({ status: 'error', message: 'toolSource is required (e.g. studio, scan, pdf).' });
    }

    const fileSize = req.file.size || 0;
    const fileType = getFileType(req.file.mimetype);

    // Save file metadata in MongoDB
    const newFile = await FileModel.create({
      userId: req.user._id,
      toolSource,
      fileName: req.file.originalname,
      fileUrl: req.file.path, // Cloudinary URL
      fileType,
      size: fileSize,
    });

    // Update user's storage usage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: fileSize }
    });

    res.status(201).json({
      status: 'success',
      file: newFile,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Upload failed.' });
  }
};

// @desc    Get all files for logged-in user
// @route   GET /api/files/my-files
// @access  Private
export const getMyFiles = async (req, res) => {
  try {
    if (req.user.plan === 'free') {
      return res.status(403).json({ status: 'error', message: 'Cloud Library is available for Pro users only.' });
    }

    const { source, type, search } = req.query;

    const query = {
      userId: req.user._id,
      isDeleted: false,
    };

    if (source && source !== 'All') query.toolSource = source;
    if (type) query.fileType = type;
    if (search) query.fileName = { $regex: search, $options: 'i' };

    const files = await FileModel.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: files.length,
      files,
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch files.' });
  }
};

// @desc    Soft-delete a file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await FileModel.findOne({ _id: req.params.id, userId: req.user._id });

    if (!file) {
      return res.status(404).json({ status: 'error', message: 'File not found.' });
    }

    // Mark as deleted (soft delete)
    file.isDeleted = true;
    await file.save();

    // Free up user storage quota
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -file.size }
    });

    res.status(200).json({ status: 'success', message: 'File deleted.' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ status: 'error', message: 'Could not delete file.' });
  }
};

// @desc    Get storage usage for user
// @route   GET /api/files/storage
// @access  Private
export const getStorageInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('storageUsed plan');

    const planLimits = {
      free: 1 * 1024 * 1024 * 1024,    // 1 GB
      basic: 5 * 1024 * 1024 * 1024,   // 5 GB
      pro: 10 * 1024 * 1024 * 1024,    // 10 GB
      elite: 50 * 1024 * 1024 * 1024,  // 50 GB
    };

    const used = user.storageUsed;
    const limit = planLimits[user.plan] || planLimits.free;
    const usedGB = (used / (1024 ** 3)).toFixed(2);
    const limitGB = (limit / (1024 ** 3)).toFixed(0);
    const percentUsed = Math.round((used / limit) * 100);

    res.status(200).json({
      status: 'success',
      storage: { used, limit, usedGB, limitGB, percentUsed },
    });
  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch storage info.' });
  }
};
