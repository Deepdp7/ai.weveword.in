import { prisma } from '../config/db.js';
import * as pdfService from '../services/pdfService.js';
import cloudinary from '../config/cloudinary.js';
import mammoth from 'mammoth';
import fs from 'fs';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { deductCredits } from '../utils/creditManager.js';

// Server Page Dimensions at 150 DPI
const SERVER_PAGE_DIMENSIONS = {
  a4: { width: 1240, height: 1754, marginX: 180, marginY: 140 },
  letter: { width: 1275, height: 1650, marginX: 180, marginY: 140 },
  a3: { width: 1754, height: 2480, marginX: 240, marginY: 200 },
  legal: { width: 1275, height: 2100, marginX: 180, marginY: 140 },
};

const fontCache = new Map();

const getOrDownloadFont = async (fontFamily) => {
  const cleanName = fontFamily.replace(/['"\s]/g, '');
  if (fontCache.has(cleanName)) {
    return cleanName;
  }

  const fontsDir = path.join(process.cwd(), 'temp', 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  const fontPath = path.join(fontsDir, `${cleanName}.ttf`);
  
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: fontFamily });
      fontCache.set(cleanName, fontFamily);
      return fontFamily;
    } catch (err) {
      console.error('Failed to register cached font:', err);
    }
  }

  // Fetch CSS from Google Fonts to find TTF link
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${cleanName.replace(/\s+/g, '+')}`;
    const res = await fetch(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
      }
    });
    if (res.ok) {
      const cssContent = await res.text();
      const ttfMatch = cssContent.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
      if (ttfMatch && ttfMatch[1]) {
        const ttfUrl = ttfMatch[1];
        const ttfRes = await fetch(ttfUrl);
        if (ttfRes.ok) {
          const arrayBuffer = await ttfRes.arrayBuffer();
          fs.writeFileSync(fontPath, Buffer.from(arrayBuffer));
          
          registerFont(fontPath, { family: fontFamily });
          fontCache.set(cleanName, fontFamily);
          return fontFamily;
        }
      }
    }
  } catch (error) {
    console.error(`Failed to download and register font ${fontFamily}:`, error);
  }

  return 'Comic Sans MS'; // Fallback
};

// Handwriting Engine
export const renderHandwriting = async (req, res) => {
  try {
    const { text, color, paperStyle, fontSize, letterSpacing, wordSpacing, fontFamily, showMargin, isHumanized, pageSize } = req.body;
    const pages = [];
    
    const resolvedFont = await getOrDownloadFont(fontFamily || 'Dancing Script');
    const pSize = pageSize || 'a4';
    const dimensions = SERVER_PAGE_DIMENSIONS[pSize] || SERVER_PAGE_DIMENSIONS.a4;
    const { width, height, marginX, marginY } = dimensions;
    
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
        if (showMargin !== false) {
          ctx.strokeStyle = '#fca5a5';
          ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, height); ctx.stroke();
        }
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
      ctx.font = `${fontSize || 24}px "${resolvedFont}"`; 
      
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
            const jitterX = showMargin !== false && isHumanized !== false ? (Math.random() - 0.5) * 5 : 0;
            const jitterY = showMargin !== false && isHumanized !== false ? (Math.random() - 0.5) * 3 : 0;
            
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
        ctx.font = `${fontSize || 24}px "${resolvedFont}"`;
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
    const { text, color, paperStyle, fontSize, letterSpacing, wordSpacing, fontFamily, showMargin, isHumanized, pageSize } = req.body;
    const pageBuffers = [];
    
    const resolvedFont = await getOrDownloadFont(fontFamily || 'Dancing Script');
    const pSize = pageSize || 'a4';
    const dimensions = SERVER_PAGE_DIMENSIONS[pSize] || SERVER_PAGE_DIMENSIONS.a4;
    const { width, height, marginX, marginY } = dimensions;

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
        if (showMargin !== false) {
          ctx.strokeStyle = '#fca5a5';
          ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, height); ctx.stroke();
        }
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
      ctx.font = `${fontSize || 24}px "${resolvedFont}"`; 
      let y = marginY;
      for (let line of textContent) {
        const jitterX = showMargin !== false && isHumanized !== false ? (Math.random() - 0.5) * 5 : 0;
        const jitterY = showMargin !== false && isHumanized !== false ? (Math.random() - 0.5) * 3 : 0;
        
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
        ctx.font = `${fontSize || 24}px "${resolvedFont}"`;
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

    // Deduct Credits
    await deductCredits(req.user.id || req.user._id, 10, 'studio', 'Exported Handwriting to PDF');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Waveword AI_Export.pdf');
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
    const userId = req.user.id || req.user._id;
    let project;

    const formattedSections = sections.map((s, index) => ({
      sectionId: s.id || s.sectionId || `sec_${index}`,
      title: s.title || '',
      order: s.order ?? index,
      content: s.content || ''
    }));

    if (projectId) {
      project = await prisma.project.update({
        where: { id: projectId },
        data: {
          title,
          sections: {
            deleteMany: {},
            create: formattedSections
          }
        },
        include: { sections: true }
      });
    } else {
      project = await prisma.project.create({
        data: {
          userId,
          title,
          sections: {
            create: formattedSections
          }
        },
        include: { sections: true }
      });
    }

    res.status(200).json({ status: 'success', project });
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({ error: 'Failed to save project.' });
  }
};

// Export Project to PDF
export const exportProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id || req.user._id;
    
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { sections: { orderBy: { order: 'asc' } } }
    });
    
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
      folder: `waveword-ai/users/${userId}/projects`,
      resource_type: 'image',
      type: 'upload',
      access_mode: 'public'
    });

    // Save to Library
    const newFile = await prisma.file.create({
      data: {
        userId: userId,
        toolSource: 'project',
        fileName: `${project.title}.pdf`,
        fileUrl: result.secure_url,
        fileType: 'pdf',
        size: result.bytes
      }
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
    const userId = req.user.id || req.user._id;
    const projects = await prisma.project.findMany({
      where: { userId, isDeleted: false },
      include: { sections: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.status(200).json({ status: 'success', projects });
  } catch (error) {
    console.error('Fetch projects error:', error);
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

    // Deduct Credits
    await deductCredits(req.user.id || req.user._id, 10, 'studio', 'Extracted text from document');

    res.status(200).json({ status: 'success', text: extractedText });
  } catch (error) {
    console.error('Text Extraction Error:', error);
    res.status(500).json({ error: 'Failed to extract text from file.' });
  }
};
