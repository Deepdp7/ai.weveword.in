import express from 'express';
import * as pdfController from '../controllers/pdfController.js'; // I'll add signature methods to a new controller or use this
import { protect, checkCredits } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import { deductCredits } from '../utils/creditManager.js';

const router = express.Router();

router.use(protect);

// Get all saved signatures for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const signatures = await prisma.file.findMany({ 
      where: {
        userId, 
        toolSource: 'signature',
        isDeleted: false 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', signatures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signatures.' });
  }
});

// Save a new signature
router.post('/save', checkCredits(5), async (req, res) => {
  try {
    const { signatureData, fileName } = req.body; // base64 data
    const userId = req.user.id || req.user._id;

    if (!signatureData) {
      return res.status(400).json({ error: 'No signature data provided.' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(signatureData, {
      folder: `waveword-ai/users/${userId}/signatures`,
      resource_type: 'image'
    });

    const newSignature = await prisma.file.create({
      data: {
        userId,
        toolSource: 'signature',
        fileName: fileName || `Signature_${Date.now()}.png`,
        fileUrl: result.secure_url,
        fileType: 'png',
        size: result.bytes
      }
    });

    await deductCredits(userId, 5, 'signature', 'Saved a new signature');

    res.status(201).json({ status: 'success', signature: newSignature });
  } catch (error) {
    console.error('Save Signature Error:', error);
    res.status(500).json({ error: 'Failed to save signature.' });
  }
});

// Delete a signature
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const signature = await prisma.file.findFirst({
      where: { id: req.params.id, userId, toolSource: 'signature' }
    });
    
    if (!signature) return res.status(404).json({ error: 'Signature not found.' });
    
    await prisma.file.update({
      where: { id: signature.id },
      data: { isDeleted: true }
    });
    
    res.status(200).json({ status: 'success', message: 'Signature deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete signature.' });
  }
});

export default router;
