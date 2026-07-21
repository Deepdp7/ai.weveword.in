import { prisma } from '../config/db.js';
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
    const userId = req.user.id || req.user._id;

    // Save file metadata in database
    const newFile = await prisma.file.create({
      data: {
        userId,
        toolSource,
        fileName: req.file.originalname,
        fileUrl: req.file.path, // Cloudinary URL
        fileType,
        size: fileSize,
      }
    });

    // Update user's storage usage
    await prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: fileSize } }
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
    const { source, type, search } = req.query;
    const userId = req.user.id || req.user._id;

    const where = {
      userId,
      isDeleted: false,
    };

    if (source && source !== 'All') where.toolSource = source;
    if (type) where.fileType = type;
    if (search) where.fileName = { contains: search };

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

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
    const userId = req.user.id || req.user._id;
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, userId } 
    });

    if (!file) {
      return res.status(404).json({ status: 'error', message: 'File not found.' });
    }

    // Mark as deleted (soft delete)
    await prisma.file.update({
      where: { id: file.id },
      data: { isDeleted: true }
    });

    // Free up user storage quota
    await prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: file.size } }
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
    const userId = req.user.id || req.user._id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageUsed: true, plan: true }
    });

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
