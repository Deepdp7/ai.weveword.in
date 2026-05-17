import { createCanvas } from 'canvas';

export const renderHandwriting = async (text, options) => {
  const { color = '#000000', paperStyle = 'white', fontSize = 24 } = options;

  // A4 Size at ~96 DPI
  const width = 794;
  const height = 1123;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw Background Paper
  if (paperStyle === 'yellow') {
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, width, height);
  } else if (paperStyle === 'ruled') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // Draw lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 100; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Draw margin
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, height);
    ctx.stroke();
  } else {
    // Default white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Text
  // Note: For MVP we use 'cursive' system font. In production, we'd register font files.
  ctx.font = `${fontSize}px 'Comic Sans MS', cursive`;
  ctx.fillStyle = color;
  
  const marginX = paperStyle === 'ruled' ? 120 : 60;
  let currentY = 100;
  
  // Simple word wrap
  const words = text.split(' ');
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > width - marginX - 60 && i > 0) {
      ctx.fillText(line, marginX, currentY);
      line = words[i] + ' ';
      currentY += (paperStyle === 'ruled' ? 40 : fontSize * 1.5);
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, marginX, currentY);

  // Return PNG buffer
  return canvas.toBuffer('image/png');
};
