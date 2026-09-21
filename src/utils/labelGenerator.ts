import { Equipment } from '../types';

export type LabelSize = 'thermal_50x30' | 'compact' | 'standard' | 'badge';

export interface LabelRenderOptions {
  showFilterSpecs?: boolean;
  showSerial?: boolean;
  showLocation?: boolean;
  showNextDue?: boolean;
  includeBorder?: boolean;
  highContrastMono?: boolean;
}

/**
 * Loads an image data URL into an HTMLImageElement asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Word wrap helper for canvas 2D contexts
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // If last line overflows, truncate with ellipsis
  if (lines.length > 0) {
    let last = lines[lines.length - 1];
    if (ctx.measureText(last).width > maxWidth) {
      while (ctx.measureText(last + '...').width > maxWidth && last.length > 3) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = last + '...';
    }
  }

  return lines;
}

/**
 * Draw a rounded rectangle on a canvas context
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates an HTML5 Canvas of the label rendered at 300 DPI (print-ready)
 */
export async function renderLabelToCanvas(
  equipment: Equipment,
  qrDataUrl: string,
  size: LabelSize,
  options: LabelRenderOptions = {}
): Promise<HTMLCanvasElement> {
  const {
    showFilterSpecs = true,
    showSerial = true,
    showLocation = true,
    showNextDue = true,
    includeBorder = true,
  } = options;

  const qrImg = await loadImage(qrDataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get canvas 2d context');

  if (size === 'thermal_50x30') {
    // 50mm x 30mm label @ ~305 DPI (12 dots/mm) -> 600 x 360 px
    // Exact 5:3 thermal aspect ratio (Phomemo, Brother, Niimbot, Dymo, Zebra, Munbyn)
    canvas.width = 600;
    canvas.height = 360;

    // Crisp white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional border (many thermal stickers are pre-cut rounded rectangles)
    if (includeBorder) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      drawRoundedRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 12);
      ctx.stroke();
    }

    // Left Section: High-contrast QR Code (280x280 px square)
    const qrSize = 280;
    const qrX = 24;
    const qrY = 28;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // "SCAN FOR INFO" text under QR code
    ctx.font = 'bold 13px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN FOR MANUAL & LOGS', qrX + qrSize / 2, qrY + qrSize + 24);

    // Vertical separator
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(320, 20);
    ctx.lineTo(320, 340);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Right Section: Appliance Specifications & Info
    const textX = 336;
    const textMaxWidth = 244;
    ctx.textAlign = 'left';

    // 1. Brand Tag / Header Badge
    const brandText = (equipment.brand || 'EQUIPMENT').toUpperCase();
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const brandMetrics = ctx.measureText(brandText);
    const pillWidth = Math.min(brandMetrics.width + 16, textMaxWidth);

    ctx.fillStyle = '#000000';
    drawRoundedRect(ctx, textX, 22, pillWidth, 24, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(brandText, textX + 8, 39);

    // 2. Equipment Name (bold, high contrast)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const nameLines = wrapText(ctx, equipment.name, textMaxWidth, 2);
    let currentY = 78;
    for (const line of nameLines) {
      ctx.fillText(line, textX, currentY);
      currentY += 28;
    }

    // 3. Model Number
    currentY = Math.max(currentY + 4, 142);
    if (equipment.modelNumber) {
      ctx.font = 'bold 18px ui-monospace, SFMono-Regular, monospace';
      const modText = `MOD: ${equipment.modelNumber}`;
      const modLines = wrapText(ctx, modText, textMaxWidth, 1);
      ctx.fillText(modLines[0], textX, currentY);
      currentY += 24;
    }

    // 4. Serial Number (if enabled)
    if (showSerial && equipment.serialNumber) {
      ctx.font = '16px ui-monospace, SFMono-Regular, monospace';
      const serText = `SN: ${equipment.serialNumber}`;
      const serLines = wrapText(ctx, serText, textMaxWidth, 1);
      ctx.fillText(serLines[0], textX, currentY);
      currentY += 22;
    }

    // 5. Filter / Consumables Specification (Critical for HVAC, Fridge, Purifiers)
    if (showFilterSpecs && equipment.specifications?.filterSize) {
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const filterText = `FILTER: ${equipment.specifications.filterSize}`;
      const filterLines = wrapText(ctx, filterText, textMaxWidth, 1);

      // Draw subtle box around filter info for quick glance
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, textX, currentY - 16, textMaxWidth, 24, 3);
      ctx.stroke();

      ctx.fillText(filterLines[0], textX + 6, currentY);
      currentY += 28;
    } else if (showLocation && equipment.locationRoom) {
      // Show location if filter not present
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const locText = `LOC: ${equipment.locationRoom}`;
      const locLines = wrapText(ctx, locText, textMaxWidth, 1);
      ctx.fillText(locLines[0], textX, currentY);
      currentY += 22;
    }

    // 6. Bottom ID
    ctx.font = '13px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = '#333333';
    ctx.fillText(`ID: ${equipment.id}`, textX, 336);

  } else if (size === 'compact') {
    // 2" x 1.5" Mini Sticker @ 300 DPI -> 600 x 450 px
    canvas.width = 600;
    canvas.height = 450;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (includeBorder) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      drawRoundedRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 14);
      ctx.stroke();
    }

    // QR on left
    const qrSize = 340;
    ctx.drawImage(qrImg, 24, 40, qrSize, qrSize);

    // Text on right
    const textX = 385;
    const textMaxWidth = 195;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';

    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText((equipment.brand || 'APPLIANCE').toUpperCase(), textX, 60);

    ctx.font = 'bold 26px -apple-system, sans-serif';
    const nameLines = wrapText(ctx, equipment.name, textMaxWidth, 3);
    let y = 100;
    for (const line of nameLines) {
      ctx.fillText(line, textX, y);
      y += 32;
    }

    if (showSerial && equipment.serialNumber) {
      ctx.font = '16px monospace';
      ctx.fillText(`SN: ${equipment.serialNumber}`, textX, y + 10);
      y += 24;
    }

    if (showLocation && equipment.locationRoom) {
      ctx.font = '16px sans-serif';
      ctx.fillText(equipment.locationRoom, textX, y + 10);
    }

    ctx.font = 'bold 14px monospace';
    ctx.fillText('SCAN FOR INFO', 24 + qrSize / 2, 415);

  } else if (size === 'badge') {
    // 4" x 2.5" Maintenance Badge @ 300 DPI -> 1200 x 750 px
    canvas.width = 1200;
    canvas.height = 750;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    drawRoundedRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 20);
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 6, canvas.width - 12, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EQUIPKEEP MAINTENANCE TAG', 40, 68);

    if (equipment.locationRoom) {
      ctx.font = '24px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(equipment.locationRoom, canvas.width - 40, 68);
    }

    // QR code on left
    const qrSize = 480;
    ctx.drawImage(qrImg, 40, 150, qrSize, qrSize);

    // Text on right
    const textX = 560;
    const textMaxWidth = 590;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';

    ctx.font = 'bold 24px sans-serif';
    ctx.fillText((equipment.brand || 'EQUIPMENT').toUpperCase(), textX, 170);

    ctx.font = 'bold 44px sans-serif';
    const nameLines = wrapText(ctx, equipment.name, textMaxWidth, 2);
    let y = 230;
    for (const line of nameLines) {
      ctx.fillText(line, textX, y);
      y += 52;
    }

    ctx.font = '28px monospace';
    if (equipment.modelNumber) {
      ctx.fillText(`MODEL: ${equipment.modelNumber}`, textX, y + 20);
      y += 42;
    }
    if (showSerial && equipment.serialNumber) {
      ctx.fillText(`SERIAL: ${equipment.serialNumber}`, textX, y + 20);
      y += 42;
    }
    if (showFilterSpecs && equipment.specifications?.filterSize) {
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`FILTER SIZE: ${equipment.specifications.filterSize}`, textX, y + 25);
      y += 45;
    }

    const nextTask = equipment.maintenanceTasks?.[0];
    if (showNextDue && nextTask) {
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`NEXT SERVICE: ${nextTask.title}`, textX, y + 25);
    }

    // Footer
    ctx.font = '20px monospace';
    ctx.fillStyle = '#555555';
    ctx.fillText('Scan with smartphone camera to view full manuals, service logs & schedules', 40, 700);
    ctx.textAlign = 'right';
    ctx.fillText(`UNIT ID: ${equipment.id}`, canvas.width - 40, 700);

  } else {
    // Standard Asset Tag (3.5" x 2") @ 300 DPI -> 1050 x 600 px
    canvas.width = 1050;
    canvas.height = 600;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (includeBorder) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000000';
      drawRoundedRect(ctx, 5, 5, canvas.width - 10, canvas.height - 10, 16);
      ctx.stroke();
    }

    // QR Code
    const qrSize = 420;
    ctx.drawImage(qrImg, 35, 70, qrSize, qrSize);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN FOR SERVICE & INFO', 35 + qrSize / 2, 535);

    // Text on right
    const textX = 490;
    const textMaxWidth = 520;
    ctx.textAlign = 'left';

    ctx.font = 'bold 24px sans-serif';
    ctx.fillText((equipment.brand || 'EQUIPMENT').toUpperCase(), textX, 90);

    ctx.font = 'bold 40px sans-serif';
    const nameLines = wrapText(ctx, equipment.name, textMaxWidth, 2);
    let y = 145;
    for (const line of nameLines) {
      ctx.fillText(line, textX, y);
      y += 48;
    }

    ctx.font = '26px monospace';
    if (equipment.modelNumber) {
      ctx.fillText(`Model: ${equipment.modelNumber}`, textX, y + 16);
      y += 38;
    }
    if (showSerial && equipment.serialNumber) {
      ctx.fillText(`Serial: ${equipment.serialNumber}`, textX, y + 16);
      y += 38;
    }
    if (showFilterSpecs && equipment.specifications?.filterSize) {
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`Filter: ${equipment.specifications.filterSize}`, textX, y + 20);
      y += 38;
    }
    if (showLocation && equipment.locationRoom) {
      ctx.font = '24px sans-serif';
      ctx.fillText(`Location: ${equipment.locationRoom}`, textX, y + 20);
    }
  }

  return canvas;
}

/**
 * Renders and triggers a browser download for the complete label as a PNG image
 */
export async function downloadLabelAsPng(
  equipment: Equipment,
  qrDataUrl: string,
  size: LabelSize,
  options: LabelRenderOptions = {}
): Promise<void> {
  const canvas = await renderLabelToCanvas(equipment, qrDataUrl, size, options);
  const dataUrl = canvas.toDataURL('image/png');

  const safeBrand = equipment.brand ? `${equipment.brand}_` : '';
  const safeName = equipment.name.replace(/[^a-zA-Z0-9]/g, '_');
  const sizeSuffix = size === 'thermal_50x30' ? '50x30mm' : size;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `EquipKeep_Label_${sizeSuffix}_${safeBrand}${safeName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
