import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

/**
 * Merges multiple PDF buffers into a single PDF buffer.
 */
export const mergePdfs = async (pdfBuffers) => {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
};

/**
 * Splits a PDF into multiple PDFs based on page ranges.
 */
export const extractPdfPages = async (pdfBuffer, ranges) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  
  const rangeParts = ranges.split(',').map(r => r.trim());
  const pagesToExtract = new Set();
  
  for (const part of rangeParts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        pagesToExtract.add(i - 1);
      }
    } else {
      pagesToExtract.add(Number(part) - 1);
    }
  }

  const sortedPages = Array.from(pagesToExtract).sort((a, b) => a - b);
  const totalPages = pdfDoc.getPageCount();
  const validPages = sortedPages.filter(p => p >= 0 && p < totalPages);

  if (validPages.length === 0) {
    throw new Error('Invalid page ranges provided.');
  }

  const copiedPages = await newPdf.copyPages(pdfDoc, validPages);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const extractedPdfBytes = await newPdf.save();
  return Buffer.from(extractedPdfBytes);
};

/**
 * Helper to convert Office documents to PDF using Local LibreOffice, Gotenberg API, or Offline Fallback.
 */
const convertOfficeToPdf = async (inputPath, ext) => {
  const outDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, ext);

  // 1. Try LibreOffice Local
  try {
    let cmd = 'libreoffice';
    if (process.platform === 'win32') {
      cmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
    }
    execSync(`${cmd} --headless --convert-to pdf --outdir "${outDir}" "${inputPath}"`, { stdio: 'ignore' });
    const outputPath = path.join(outDir, `${baseName}.pdf`);
    if (fs.existsSync(outputPath)) {
      const buffer = fs.readFileSync(outputPath);
      fs.unlinkSync(outputPath);
      return buffer;
    }
  } catch (err) {
    console.log(`Local LibreOffice failed or missing. Trying Gotenberg fallback for ${ext}...`);
  }

  // 2. Try Gotenberg cloud API (keyless) fallback
  try {
    const fileBuffer = fs.readFileSync(inputPath);
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files"; filename="${path.basename(inputPath)}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const response = await fetch('https://demo.gotenberg.dev/forms/libreoffice/convert', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    console.log('Gotenberg cloud API returned status:', response.status);
  } catch (apiErr) {
    console.log('Gotenberg cloud API conversion failed. Trying pure JS fallback...');
  }

  // 3. Fallbacks
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: inputPath });
    return await txtToPdfContent(result.value);
  }
  if (ext === '.xlsx') {
    const workbook = xlsx.readFile(inputPath);
    let content = '';
    workbook.SheetNames.forEach(sheetName => {
      content += `\n--- SHEET: ${sheetName} ---\n`;
      const worksheet = workbook.Sheets[sheetName];
      content += xlsx.utils.sheet_to_txt(worksheet);
    });
    return await txtToPdfContent(content);
  }
  if (ext === '.txt') {
    const text = fs.readFileSync(inputPath, 'utf-8');
    return await txtToPdfContent(text);
  }

  throw new Error(`Failed to convert ${ext} file. Please ensure LibreOffice is installed or you are online.`);
};

/**
 * Converts Word (.docx) to PDF.
 */
export const wordToPdf = async (inputPath) => {
  return convertOfficeToPdf(inputPath, '.docx');
};

/**
 * Converts Excel (.xlsx) to PDF.
 */
export const excelToPdf = async (inputPath) => {
  return convertOfficeToPdf(inputPath, '.xlsx');
};

/**
 * Converts TXT to PDF.
 */
export const txtToPdf = async (inputPath) => {
  const text = fs.readFileSync(inputPath, 'utf-8');
  return await txtToPdfContent(text);
};

/**
 * Internal text-to-pdf engine.
 */
export async function txtToPdfContent(text) {
  const lines = text.split('\n');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const fontSize = 10;
  const lineHeight = 14;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);

  let i = 0;
  while (i < lines.length) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    for (let j = 0; j < maxLines && i < lines.length; j++) {
      const line = lines[i].substring(0, 100).trim();
      if (line) {
        page.drawText(line, { x: margin, y, size: fontSize, font });
      }
      y -= lineHeight;
      i++;
    }
  }
  return Buffer.from(await pdfDoc.save());
}

/**
 * Images to PDF.
 */
export const imagesToPdf = async (images, isBuffer = false) => {
  const pdfDoc = await PDFDocument.create();
  for (const imgSource of images) {
    const imgBytes = isBuffer ? imgSource : fs.readFileSync(imgSource);
    // Auto-detect format for buffers, or use extension for paths
    const ext = isBuffer ? 'png' : path.extname(imgSource).toLowerCase();
    
    let image;
    try {
      if (isBuffer || ext === '.png') image = await pdfDoc.embedPng(imgBytes);
      else if (ext === '.jpg' || ext === '.jpeg') image = await pdfDoc.embedJpg(imgBytes);
      else continue;
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } catch (e) { console.error('Image embed error:', e); }
  }
  return Buffer.from(await pdfDoc.save());
};

/**
 * Master office-to-pdf wrapper.
 */
export const officeToPdf = async (inputPath) => {
  const ext = path.extname(inputPath).toLowerCase();
  return convertOfficeToPdf(inputPath, ext);
};
