import * as pdfService from '../services/pdfService.js';
import cloudinary from '../config/cloudinary.js';
import FileModel from '../models/File.js';
import path from 'path';
import fs from 'fs';

// Helper: Upload buffer to Cloudinary and save to DB
const uploadAndSave = async ({ userId, buffer, fileName, toolSource }) => {
  try {
    const base64Data = buffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `waveword-ai/users/${userId}/pdf`,
      resource_type: 'image',
      type: 'upload',
      access_mode: 'public'
    });

    const newFile = await FileModel.create({
      userId,
      toolSource,
      fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      fileUrl: result.secure_url,
      fileType: 'pdf',
      size: result.bytes
    });

    return newFile;
  } catch (error) {
    console.error('PDF Upload Error:', error);
    throw error;
  }
};

export const merge = async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
    }
    const pdfBuffers = req.files.map(file => file.buffer);
    const mergedBuffer = await pdfService.mergePdfs(pdfBuffers);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(mergedBuffer);
  } catch (error) {
    console.error('Merge Error:', error);
    res.status(500).json({ error: 'Failed to merge PDFs.' });
  }
};

export const split = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const { ranges } = req.body;
    if (!ranges) return res.status(400).json({ error: 'Please provide page ranges.' });

    const extractedBuffer = await pdfService.extractPdfPages(req.file.buffer, ranges);
    
    if (req.user) {
      const file = await uploadAndSave({
        userId: req.user._id,
        buffer: extractedBuffer,
        fileName: 'extracted.pdf',
        toolSource: 'pdf'
      });
      return res.status(200).json({ status: 'success', url: file.fileUrl, fileName: file.fileName });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="extracted.pdf"');
    res.send(extractedBuffer);
  } catch (error) {
    console.error('Split Error:', error);
    res.status(500).json({ error: error.message || 'Failed to split PDF.' });
  }
};

export const wordToPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    // Multer diskStorage is needed for LibreOffice, but we use memoryStorage.
    // So we must write it to a temp file first.
    const tempInput = path.join('temp', `${Date.now()}_${req.file.originalname}`);
    if (!fs.existsSync('temp')) fs.mkdirSync('temp');
    fs.writeFileSync(tempInput, req.file.buffer);

    const pdfBuffer = await pdfService.officeToPdf(tempInput);
    fs.unlinkSync(tempInput); // Clean up original

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^/.]+$/, "")}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const pptToPdf = async (req, res) => {
  return wordToPdf(req, res); // Logic is identical
};

export const excelToPdf = async (req, res) => {
  return wordToPdf(req, res); // Logic is identical
};

export const txtToPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const tempInput = path.join('temp', `${Date.now()}_${req.file.originalname}`);
    if (!fs.existsSync('temp')) fs.mkdirSync('temp');
    fs.writeFileSync(tempInput, req.file.buffer);

    const pdfBuffer = await pdfService.txtToPdf(tempInput);
    fs.unlinkSync(tempInput);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^/.]+$/, "")}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const jpgToPdf = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded.' });
    
    const tempPaths = req.files.map(f => {
      const p = path.join('temp', `${Date.now()}_${f.originalname}`);
      if (!fs.existsSync('temp')) fs.mkdirSync('temp');
      fs.writeFileSync(p, f.buffer);
      return p;
    });

    const pdfBuffer = await pdfService.imagesToPdf(tempPaths);
    tempPaths.forEach(p => fs.unlinkSync(p));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Images_to_PDF_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
