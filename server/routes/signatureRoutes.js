import express from 'express';
import * as pdfController from '../controllers/pdfController.js'; // I'll add signature methods to a new controller or use this
import { protect } from '../middleware/authMiddleware.js';
import FileModel from '../models/File.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

router.use(protect);

// Get all saved signatures for user
router.get('/', async (req, res) => {
  try {
    const signatures = await FileModel.find({ 
      userId: req.user._id, 
      toolSource: 'signature',
      isDeleted: false 
    }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', signatures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signatures.' });
  }
});

// Save a new signature
router.post('/save', async (req, res) => {
  try {
    const { signatureData, fileName } = req.body; // base64 data

    if (!signatureData) {
      return res.status(400).json({ error: 'No signature data provided.' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(signatureData, {
      folder: `kolomflow/users/${req.user._id}/signatures`,
      resource_type: 'image'
    });

    const newSignature = await FileModel.create({
      userId: req.user._id,
      toolSource: 'signature',
      fileName: fileName || `Signature_${Date.now()}.png`,
      fileUrl: result.secure_url,
      fileType: 'png',
      size: result.bytes
    });

    res.status(201).json({ status: 'success', signature: newSignature });
  } catch (error) {
    console.error('Save Signature Error:', error);
    res.status(500).json({ error: 'Failed to save signature.' });
  }
});

// Delete a signature
router.delete('/:id', async (req, res) => {
  try {
    const signature = await FileModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, toolSource: 'signature' },
      { isDeleted: true },
      { new: true }
    );
    if (!signature) return res.status(404).json({ error: 'Signature not found.' });
    res.status(200).json({ status: 'success', message: 'Signature deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete signature.' });
  }
});

export default router;
