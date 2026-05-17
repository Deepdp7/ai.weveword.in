# KolomFlow — PDF Tools Expansion Guide

> **Phase 10 Addition** | New tools: Word to PDF, TXT to PDF, PPT to PDF, JPG/PNG to PDF, Excel to PDF

---

## 1. Updated Free PDF Tools List (13 tools)

| # | Tool | Description | Credits |
|---|---|---|---|
| 1 | Merge PDF | Combine multiple PDFs into one | Free |
| 2 | Split PDF | Split by page range or every N pages | Free |
| 3 | Compress PDF | Reduce file size (low / medium / high) | Free |
| 4 | PDF to Images | Export each page as PNG or JPG | Free |
| 5 | Images to PDF | Combine multiple images into one PDF | Free |
| 6 | Rotate PDF | Rotate pages 90° / 180° / 270° | Free |
| 7 | Reorder Pages | Drag & drop page reordering | Free |
| 8 | Unlock PDF | Remove password protection | Free |
| 9 | **Word to PDF** *(new)* | Convert .docx to PDF | Free |
| 10 | **TXT to PDF** *(new)* | Convert plain text file to PDF | Free |
| 11 | **PPT to PDF** *(new)* | Convert .pptx to PDF | Free |
| 12 | **JPG / PNG to PDF** *(new)* | Convert one or more images to PDF | Free |
| 13 | **Excel to PDF** *(new)* | Convert .xlsx to PDF | Free |

---

## 2. New API Routes

Add these 5 routes to `server/routes/tools.js` alongside your existing PDF tool routes:

```js
// server/routes/tools.js

router.post('/pdf/word-to-pdf',   upload.single('file'),  pdfController.wordToPdf);
router.post('/pdf/txt-to-pdf',    upload.single('file'),  pdfController.txtToPdf);
router.post('/pdf/ppt-to-pdf',    upload.single('file'),  pdfController.pptToPdf);
router.post('/pdf/excel-to-pdf',  upload.single('file'),  pdfController.excelToPdf);
router.post('/pdf/jpg-to-pdf',    upload.array('files'),  pdfController.jpgToPdf);
```

> `upload` is your existing `multer` middleware.  
> `upload.array('files')` allows multiple image uploads for JPG/PNG to PDF.

---

## 3. Backend — `pdfService.js`

### 3.1 Word to PDF (LibreOffice headless)

```js
// server/services/pdfService.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Converts a .docx file to PDF using LibreOffice headless.
 * @param {string} inputPath - Absolute path to the uploaded .docx file
 * @returns {string} outputPath - Absolute path to the generated PDF
 */
async function wordToPdf(inputPath) {
  const outDir = path.dirname(inputPath);
  execSync(`libreoffice --headless --convert-to pdf --outdir "${outDir}" "${inputPath}"`);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outDir, `${baseName}.pdf`);
  if (!fs.existsSync(outputPath)) throw new Error('LibreOffice conversion failed');
  return outputPath;
}
```

> **Same function works for PPT to PDF and Excel to PDF** — just pass the `.pptx` or `.xlsx` file path. LibreOffice handles all three formats.

---

### 3.2 PPT to PDF (LibreOffice headless)

```js
/**
 * Converts a .pptx file to PDF using LibreOffice headless.
 * Reuses the same LibreOffice command as wordToPdf.
 */
async function pptToPdf(inputPath) {
  return await wordToPdf(inputPath); // same LibreOffice command works for .pptx
}
```

---

### 3.3 Excel to PDF (LibreOffice headless)

```js
/**
 * Converts a .xlsx file to PDF using LibreOffice headless.
 * Reuses the same LibreOffice command as wordToPdf.
 */
async function excelToPdf(inputPath) {
  return await wordToPdf(inputPath); // same LibreOffice command works for .xlsx
}
```

---

### 3.4 TXT to PDF (pdf-lib)

```js
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * Converts a plain .txt file to a formatted PDF.
 * Paginates automatically if text is longer than one page.
 * @param {string} inputPath - Absolute path to the .txt file
 * @returns {Buffer} pdfBytes - The generated PDF as a Buffer
 */
async function txtToPdf(inputPath) {
  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.split('\n');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595;   // A4 width in points
  const pageHeight = 842;  // A4 height in points
  const margin = 50;
  const fontSize = 11;
  const lineHeight = fontSize * 1.5;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (let i = 0; i < maxLinesPerPage && lineIndex < lines.length; i++) {
      page.drawText(lines[lineIndex] || ' ', {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: pageWidth - margin * 2,
      });
      y -= lineHeight;
      lineIndex++;
    }
  }

  return Buffer.from(await pdfDoc.save());
}
```

---

### 3.5 JPG / PNG to PDF (pdf-lib)

```js
/**
 * Converts one or more JPG/PNG images to a single PDF.
 * Each image gets its own page, sized to the image dimensions.
 * @param {string[]} imagePaths - Array of absolute paths to image files
 * @returns {Buffer} pdfBytes - The generated PDF as a Buffer
 */
async function jpgToPdf(imagePaths) {
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of imagePaths) {
    const imgBytes = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).toLowerCase();

    let image;
    if (ext === '.jpg' || ext === '.jpeg') {
      image = await pdfDoc.embedJpg(imgBytes);
    } else if (ext === '.png') {
      image = await pdfDoc.embedPng(imgBytes);
    } else {
      throw new Error(`Unsupported image format: ${ext}`);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return Buffer.from(await pdfDoc.save());
}

module.exports = { wordToPdf, pptToPdf, excelToPdf, txtToPdf, jpgToPdf };
```

---

## 4. Backend — `pdfController.js`

Full controller methods for all 5 new tools:

```js
// server/controllers/pdfController.js

const cloudinary = require('../config/cloudinary');
const pdfService = require('../services/pdfService');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');

// Helper: upload a local file or buffer to Cloudinary, save to DB, clean up
async function uploadAndSave({ userId, filePath, buffer, fileName, toolSource }) {
  let cloudResult;

  if (buffer) {
    // Upload from Buffer (for pdf-lib outputs)
    cloudResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `kolomflow/users/${userId}/pdf`, resource_type: 'raw', public_id: fileName },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(buffer);
    });
  } else {
    // Upload from file path (for LibreOffice outputs)
    cloudResult = await cloudinary.uploader.upload(filePath, {
      folder: `kolomflow/users/${userId}/pdf`,
      resource_type: 'raw',
    });
  }

  await File.create({
    userId,
    toolSource,
    fileName: `${fileName}.pdf`,
    fileUrl: cloudResult.secure_url,
    fileType: 'pdf',
    size: cloudResult.bytes,
  });

  // Clean up temp files
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return cloudResult.secure_url;
}

// POST /api/tools/pdf/word-to-pdf
exports.wordToPdf = async (req, res) => {
  try {
    const outputPath = await pdfService.wordToPdf(req.file.path);
    const url = await uploadAndSave({
      userId: req.user._id,
      filePath: outputPath,
      fileName: path.basename(req.file.originalname, '.docx'),
      toolSource: 'pdf',
    });
    fs.unlinkSync(req.file.path); // remove original upload
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tools/pdf/ppt-to-pdf
exports.pptToPdf = async (req, res) => {
  try {
    const outputPath = await pdfService.pptToPdf(req.file.path);
    const url = await uploadAndSave({
      userId: req.user._id,
      filePath: outputPath,
      fileName: path.basename(req.file.originalname, '.pptx'),
      toolSource: 'pdf',
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tools/pdf/excel-to-pdf
exports.excelToPdf = async (req, res) => {
  try {
    const outputPath = await pdfService.excelToPdf(req.file.path);
    const url = await uploadAndSave({
      userId: req.user._id,
      filePath: outputPath,
      fileName: path.basename(req.file.originalname, '.xlsx'),
      toolSource: 'pdf',
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tools/pdf/txt-to-pdf
exports.txtToPdf = async (req, res) => {
  try {
    const pdfBuffer = await pdfService.txtToPdf(req.file.path);
    const url = await uploadAndSave({
      userId: req.user._id,
      buffer: pdfBuffer,
      fileName: path.basename(req.file.originalname, '.txt'),
      toolSource: 'pdf',
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tools/pdf/jpg-to-pdf
exports.jpgToPdf = async (req, res) => {
  try {
    const imagePaths = req.files.map(f => f.path);
    const pdfBuffer = await pdfService.jpgToPdf(imagePaths);
    const url = await uploadAndSave({
      userId: req.user._id,
      buffer: pdfBuffer,
      fileName: `images_${Date.now()}`,
      toolSource: 'pdf',
    });
    imagePaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## 5. Frontend — `PDFTools.jsx`

Add the 5 new tool objects to your `freeTools` array:

```js
// src/pages/PDFTools.jsx — freeTools array

const freeTools = [
  // ... your existing 8 tools ...

  // ── New tools ──────────────────────────────────────────
  {
    key: 'word-to-pdf',
    label: 'Word to PDF',
    icon: 'ti-file-word',
    accept: '.docx',
    multiple: false,
    isNew: true,
  },
  {
    key: 'txt-to-pdf',
    label: 'TXT to PDF',
    icon: 'ti-file-text',
    accept: '.txt',
    multiple: false,
    isNew: true,
  },
  {
    key: 'ppt-to-pdf',
    label: 'PPT to PDF',
    icon: 'ti-presentation',
    accept: '.pptx',
    multiple: false,
    isNew: true,
  },
  {
    key: 'jpg-to-pdf',
    label: 'JPG / PNG to PDF',
    icon: 'ti-photo-plus',
    accept: '.jpg,.jpeg,.png',
    multiple: true,
    isNew: true,
  },
  {
    key: 'excel-to-pdf',
    label: 'Excel to PDF',
    icon: 'ti-file-spreadsheet',
    accept: '.xlsx',
    multiple: false,
    isNew: true,
  },
];
```

### Axios call (same pattern for all 5)

```js
// src/services/pdfService.js

import axios from 'axios';

export const convertToPdf = async (toolKey, files) => {
  const formData = new FormData();

  if (Array.isArray(files)) {
    // jpg-to-pdf sends multiple files
    files.forEach(file => formData.append('files', file));
  } else {
    formData.append('file', files);
  }

  const res = await axios.post(`/api/tools/pdf/${toolKey}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });

  return res.data.url; // Cloudinary URL
};
```

---

## 6. File Accept Types & Size Limits

| Tool | Multer `accept` | Max Size |
|---|---|---|
| Word to PDF | `.docx` | 50 MB |
| TXT to PDF | `.txt` | 10 MB |
| PPT to PDF | `.pptx` | 50 MB |
| Excel to PDF | `.xlsx` | 50 MB |
| JPG / PNG to PDF | `.jpg, .jpeg, .png` | 50 MB per image, max 20 images |

Add MIME validation in your multer config:

```js
// server/middleware/upload.js

const multer = require('multer');
const path = require('path');

const ALLOWED_MIMES = {
  'word-to-pdf':  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'txt-to-pdf':   ['text/plain'],
  'ppt-to-pdf':   ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  'excel-to-pdf': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'jpg-to-pdf':   ['image/jpeg', 'image/png'],
};
```

---

## 7. LibreOffice Setup on Server

LibreOffice must be installed on your Railway / Render server. Add this to your `Dockerfile` or build script:

```dockerfile
# Dockerfile
RUN apt-get update && apt-get install -y libreoffice --no-install-recommends
```

Or for Railway/Render with a `nixpacks.toml`:

```toml
# nixpacks.toml
[phases.setup]
aptPkgs = ["libreoffice"]
```

Verify it works:

```bash
libreoffice --version
# LibreOffice 7.x.x ...
```

---

## 8. Summary of Changes

| File | Change |
|---|---|
| `server/services/pdfService.js` | Add `wordToPdf`, `pptToPdf`, `excelToPdf`, `txtToPdf`, `jpgToPdf` functions |
| `server/controllers/pdfController.js` | Add 5 new controller methods |
| `server/routes/tools.js` | Add 5 new POST routes |
| `server/middleware/upload.js` | Add MIME type validation for new formats |
| `client/src/pages/PDFTools.jsx` | Add 5 new tool objects to `freeTools` array |
| `client/src/services/pdfService.js` | Add `convertToPdf` Axios helper |
| `Dockerfile` / `nixpacks.toml` | Install LibreOffice on server |
| PRD Section 6.7 | Update free tools count from 8 → 13 |

---

*KolomFlow — PDF Tools Expansion | Phase 10 | May 2026*
