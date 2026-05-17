import Project from '../models/Project.js';
import File from '../models/File.js';
import * as pdfService from '../services/pdfService.js';
import cloudinary from '../config/cloudinary.js';
import mammoth from 'mammoth';
import fs from 'fs';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';

// Handwriting Engine
export const renderHandwriting = async (req, res) => {
  try {
    const { text, color, paperStyle, fontSize, letterSpacing, wordSpacing } = req.body;
    const pages = [];
    
    // A4 Dimensions at 150 DPI
    const width = 1240;
    const height = 1754;
    
    const marginX = 180;
    const marginY = 140;
    const maxWidth = width - marginX - 100;
    const lSpacing = letterSpacing || 0;
    const wSpacing = wordSpacing || 0;
    const lineHeight = (fontSize || 24) * 1.5;
    const maxLinesPerPage = Math.floor((height - marginY - 100) / lineHeight);

    const paragraphs = text.split(/\r?\n/);
    let currentPageLines = [];
    let lineCount = 0;

    const createPage = (textContent) => {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Draw Paper Themes
      if (paperStyle === 'yellow' || paperStyle === 'vintage') {
        ctx.fillStyle = '#fef3c7';
      } else if (paperStyle === 'burnt') {
        ctx.fillStyle = '#c19a6b';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, width, height);

      // Draw Lines / Grids
      if (paperStyle === 'ruled' || paperStyle === 'school') {
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        for (let y = lineHeight + 100; y < height; y += lineHeight) {
          ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(width - 100, y); ctx.stroke();
        }
        ctx.strokeStyle = '#fca5a5';
        ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, height); ctx.stroke();
      } else if (paperStyle === 'engineering') {
        ctx.strokeStyle = '#10b98122'; ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
      }

      // Draw Text
      ctx.fillStyle = color || '#000000';
      ctx.font = `${fontSize || 24}px "Comic Sans MS", cursive`; 
      
      let y = marginY;

      for (let line of textContent) {
        let x = marginX;
        const isTable = line.includes('\t') || (line.split('|').length > 2);
        
        if (isTable) {
          ctx.strokeStyle = color || '#000000';
          ctx.globalAlpha = 0.3; ctx.beginPath();
          ctx.moveTo(marginX - 20, y + 5); ctx.lineTo(width - 100, y + 5); ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        const segments = line.split(/\t| {3,}|\|/);
        const tabWidth = maxWidth / Math.max(segments.length, 4);

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i].trim();
          if (segment) {
            const jitterX = (Math.random() - 0.5) * 5;
            const jitterY = (Math.random() - 0.5) * 3;
            
            // Render with letter spacing
            let charX = x + jitterX;
            for (let char of segment) {
              ctx.fillText(char, charX, y + jitterY);
              charX += ctx.measureText(char).width + lSpacing;
            }
          }
          x += tabWidth + wSpacing;
        }
        y += lineHeight;
      }
      return canvas.toBuffer('image/png').toString('base64');
    };

    for (let para of paragraphs) {
      if (!para.trim()) { currentPageLines.push(""); lineCount++; continue; }
      const words = para.split(/\s+/);
      let currentLine = "";
      for (let word of words) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize || 24}px "Comic Sans MS", cursive`;
        const metrics = ctx.measureText(currentLine + word + " ");
        if (metrics.width > maxWidth && currentLine.length > 0) {
          currentPageLines.push(currentLine);
          currentLine = word + " ";
          lineCount++;
          if (lineCount >= maxLinesPerPage) {
            pages.push(createPage(currentPageLines));
            currentPageLines = []; lineCount = 0;
          }
        } else { currentLine += word + " "; }
      }
      if (currentLine) { currentPageLines.push(currentLine); lineCount++; }
      if (lineCount >= maxLinesPerPage) {
        pages.push(createPage(currentPageLines));
        currentPageLines = []; lineCount = 0;
      }
    }
    if (currentPageLines.length > 0) pages.push(createPage(currentPageLines));

    res.status(200).json({ status: 'success', pages });

  } catch (error) {
    console.error('Handwriting Render Error:', error);
    res.status(500).json({ error: 'Failed to generate handwriting preview.' });
  }
};

// Export to PDF
export const exportPdf = async (req, res) => {
  try {
    const { text, color, paperStyle, fontSize, letterSpacing, wordSpacing } = req.body;
    const pageBuffers = [];
    
    const width = 1240;
    const height = 1754;
    const marginX = 180;
    const marginY = 140;
    const maxWidth = width - marginX - 100;
    const lSpacing = letterSpacing || 0;
    const wSpacing = wordSpacing || 0;
    const lineHeight = (fontSize || 24) * 1.5;
    const maxLinesPerPage = Math.floor((height - marginY - 100) / lineHeight);

    const paragraphs = text.split(/\r?\n/);
    let currentPageLines = [];
    let lineCount = 0;

    const createPageBuffer = (textContent) => {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      if (paperStyle === 'yellow' || paperStyle === 'vintage') {
        ctx.fillStyle = '#fef3c7';
      } else if (paperStyle === 'burnt') {
        ctx.fillStyle = '#c19a6b';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, width, height);

      if (paperStyle === 'ruled' || paperStyle === 'school') {
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        for (let y = lineHeight + 100; y < height; y += lineHeight) {
          ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(width - 100, y); ctx.stroke();
        }
        ctx.strokeStyle = '#fca5a5';
        ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, height); ctx.stroke();
      } else if (paperStyle === 'engineering') {
        ctx.strokeStyle = '#10b98122'; ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
      }

      ctx.fillStyle = color || '#000000';
      ctx.font = `${fontSize || 24}px "Comic Sans MS", cursive`; 
      let y = marginY;
      for (let line of textContent) {
        const jitterX = (Math.random() - 0.5) * 5;
        const jitterY = (Math.random() - 0.5) * 3;
        
        let x = marginX;
        const segments = line.split(/\t| {3,}|\|/);
        const tabWidth = maxWidth / Math.max(segments.length, 4);
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i].trim();
          if (segment) {
            let charX = x + jitterX;
            for (let char of segment) {
              ctx.fillText(char, charX, y + jitterY);
              charX += ctx.measureText(char).width + lSpacing;
            }
          }
          x += tabWidth + wSpacing;
        }
        y += lineHeight;
      }
      return canvas.toBuffer('image/png');
    };

    for (let para of paragraphs) {
      if (!para.trim()) { currentPageLines.push(""); lineCount++; continue; }
      const words = para.split(/\s+/);
      let currentLine = "";
      for (let word of words) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize || 24}px "Comic Sans MS", cursive`;
        const metrics = ctx.measureText(currentLine + word + " ");
        if (metrics.width > maxWidth && currentLine.length > 0) {
          currentPageLines.push(currentLine);
          currentLine = word + " ";
          lineCount++;
          if (lineCount >= maxLinesPerPage) {
            pageBuffers.push(createPageBuffer(currentPageLines));
            currentPageLines = []; lineCount = 0;
          }
        } else { currentLine += word + " "; }
      }
      if (currentLine) { currentPageLines.push(currentLine); lineCount++; }
      if (lineCount >= maxLinesPerPage) {
        pageBuffers.push(createPageBuffer(currentPageLines));
        currentPageLines = []; lineCount = 0;
      }
    }
    if (currentPageLines.length > 0) pageBuffers.push(createPageBuffer(currentPageLines));

    // Combine into PDF
    const pdfBuffer = await pdfService.imagesToPdf(pageBuffers, true); // Added true for 'buffers' mode

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=KolomFlow_Export.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ error: 'Failed to export PDF.' });
  }
};


// Create or Update Project
export const saveProject = async (req, res) => {
  try {
    const { title, sections, projectId } = req.body;
    let project;

    if (projectId) {
      project = await Project.findOneAndUpdate(
        { _id: projectId, userId: req.user._id },
        { title, sections },
        { new: true }
      );
    } else {
      project = await Project.create({
        userId: req.user._id,
        title,
        sections
      });
    }

    res.status(200).json({ status: 'success', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save project.' });
  }
};

// Export Project to PDF
export const exportProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Compile content
    let fullText = `${project.title.toUpperCase()}\n\n`;
    project.sections.forEach(section => {
      fullText += `\n\n--- ${section.title.toUpperCase()} ---\n\n`;
      fullText += section.content;
    });

    // Generate PDF Buffer
    const pdfBuffer = await pdfService.txtToPdfContent(fullText);

    // Upload to Cloudinary
    const base64Data = pdfBuffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `kolomflow/users/${req.user._id}/projects`,
      resource_type: 'auto',
      type: 'upload',
      access_mode: 'public'
    });

    // Save to Library
    const newFile = await File.create({
      userId: req.user._id,
      toolSource: 'project',
      fileName: `${project.title}.pdf`,
      fileUrl: result.secure_url,
      fileType: 'pdf',
      size: result.bytes
    });

    res.status(200).json({ 
      status: 'success', 
      url: result.secure_url,
      file: newFile
    });

  } catch (error) {
    console.error('Export Project Error:', error);
    res.status(500).json({ error: 'Failed to export project.' });
  }
};

// Get user projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id, isDeleted: false }).sort({ updatedAt: -1 });
    res.status(200).json({ status: 'success', projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

// Extract text from uploaded file (.docx, .txt)
export const extractText = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const filePath = req.file.path;
    const extension = req.file.originalname.split('.').pop().toLowerCase();
    let extractedText = '';

    if (extension === 'docx') {
      const result = await mammoth.convertToHtml({ path: filePath });
      let html = result.value;
      
      // Simple HTML to Text converter that preserves tables
      // 1. Handle table rows
      html = html.replace(/<\/tr>/g, '\n');
      // 2. Handle table cells (add tabs)
      html = html.replace(/<\/td>/g, '\t');
      // 3. Handle paragraphs
      html = html.replace(/<\/p>/g, '\n');
      // 4. Strip all other tags
      extractedText = html.replace(/<[^>]*>/g, '');
      // 5. Decode basic entities
      extractedText = extractedText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    } else if (extension === 'txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload .docx or .txt' });
    }

    // Clean up temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({ status: 'success', text: extractedText });
  } catch (error) {
    console.error('Text Extraction Error:', error);
    res.status(500).json({ error: 'Failed to extract text from file.' });
  }
};
