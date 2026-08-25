/**
 * @fileoverview Niimbot Thermal Label Printer Protocol Driver (Supports B1, B21, D11, D110, etc.).
 * Pixel-perfect adaptation of faith-forge-desktop-controller Dymo Child Label Template
 * for portable Niimbot B1 (384x240 dots, 48mm @ 203 DPI).
 */

import {
  NiimbotBluetoothClient,
  ImageEncoder,
  LabelType,
} from '@mmote/niimbluelib';
import QRCode from 'qrcode';
import { KidTicketData } from './escposBuilder';

export const niimbotClient = new NiimbotBluetoothClient();

/**
 * Generates an offscreen QR code canvas.
 */
const generateQRCodeCanvas = async (text: string, size = 80): Promise<HTMLCanvasElement> => {
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = size;
  qrCanvas.height = size;
  await QRCode.toCanvas(qrCanvas, text, {
    margin: 1,
    width: size,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
  return qrCanvas;
};

/**
 * Splits a full name into firstName and lastName parts matching desktop-controller.
 */
const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) {
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
  }
  // If 3 or 4 names: first 2 are given names, rest are surnames
  const mid = Math.min(2, Math.floor(parts.length / 2));
  return {
    firstName: parts.slice(0, mid).join(' '),
    lastName: parts.slice(mid).join(' '),
  };
};

/**
 * Formats date to Spanish locale matching desktop-controller.
 */
const formatPrintDate = (dateVal?: string): string => {
  const d = dateVal ? new Date(dateVal) : new Date();
  if (isNaN(d.getTime())) return dateVal || new Date().toLocaleString('es-CO');
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Renders the child sticker based directly on faith-forge-desktop-controller template.
 * Canvas: 384 x 240 pixels (48mm @ 203 DPI).
 */
export const renderKidTicketToCanvas = async (data: KidTicketData): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const width = 384;
  const height = 240;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Solid white canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // 1. SECTION HEADER (👦 NIÑO / 👧 NIÑA / ★ YO SOY IGLEKIDS ★ | Cód: 123456)
  const headerLeft = data.isVolunteer
    ? '★ YO SOY IGLEKIDS ★'
    : (data.gender?.toLowerCase() === 'female' || data.gender?.toLowerCase() === 'femenino' ? '👧 NIÑA' : '👦 NIÑO');
  const code = data.securityCode || '000000';

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(headerLeft, 10, 20);

  ctx.textAlign = 'right';
  ctx.fillText(`Cód: ${code}`, width - 10, 20);

  // Header separator line
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, 25);
  ctx.lineTo(width - 8, 25);
  ctx.stroke();

  // 2. NAME SECTION (Centered bold name-main and name-sub)
  const { firstName, lastName } = splitFullName(data.kidName.toUpperCase());

  ctx.textAlign = 'center';
  if (lastName) {
    // Two-line layout
    ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
    ctx.fillText(firstName, width / 2, 45);

    ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
    ctx.fillText(lastName, width / 2, 63);
  } else {
    // Single line layout
    ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
    ctx.fillText(firstName, width / 2, 53);
  }

  // 3. SALÓN (Centered bold: Salón: [Nombre])
  const roomName = data.kidGroup || 'General';
  ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
  ctx.fillText(`Salón: ${roomName}`, width / 2, 82);

  // Divider line
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 90);
  ctx.lineTo(width - 10, 90);
  ctx.stroke();

  // 4. BOTTOM SECTION: Info on Left + QR Code on Right
  const qrSize = 84;
  const qrX = width - qrSize - 10;
  const qrY = 100;

  try {
    const qrCanvas = await generateQRCodeCanvas(code, qrSize);
    ctx.drawImage(qrCanvas, qrX, qrY);

    // QR label border box
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);
  } catch (err) {
    console.warn('[Niimbot] QR error:', err);
  }

  // Left Column Info (Max width ~265px)
  ctx.textAlign = 'left';
  let curY = 106;

  // Reunión
  const meetingStr = [data.campusName, data.meetingName].filter(Boolean).join(' • ');
  if (meetingStr) {
    ctx.font = '10px Arial, Helvetica, sans-serif';
    const truncatedMeeting = meetingStr.length > 38 ? meetingStr.slice(0, 36) + '...' : meetingStr;
    ctx.fillText(`Reunión: ${truncatedMeeting}`, 10, curY);
    curY += 15;
  }

  // Acudiente / Tutor
  if (data.guardianName) {
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    const gPhone = data.guardianPhone ? ` (${data.guardianPhone})` : '';
    const gText = `Acudiente: ${data.guardianName}${gPhone}`;
    const truncatedG = gText.length > 36 ? gText.slice(0, 34) + '...' : gText;
    ctx.fillText(truncatedG, 10, curY);
    curY += 16;
  }

  // Observaciones (highlighted if present)
  if (data.observation && data.observation.toLowerCase() !== 'ninguna') {
    const obsText = `Obs: ${data.observation}`;
    const truncatedObs = obsText.length > 36 ? obsText.slice(0, 34) + '...' : obsText;

    // Background gray highlight box
    ctx.fillStyle = '#E4E4E7';
    ctx.fillRect(8, curY - 10, qrX - 14, 15);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
    ctx.fillText(truncatedObs, 10, curY + 2);
    curY += 17;
  }

  // Fecha impresión
  ctx.fillStyle = '#000000';
  ctx.font = '9.5px Arial, Helvetica, sans-serif';
  const printDateStr = `Fecha impresión: ${formatPrintDate(data.date)}`;
  ctx.fillText(printDateStr, 10, 226);

  return canvas;
};

/**
 * Diagnostic test label based on faith-forge-desktop-controller template.
 */
export const renderTestTicketToCanvas = async (printerName = 'Niimbot B1'): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const width = 384;
  const height = 240;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Header
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('👦 NIÑO', 10, 20);

  ctx.textAlign = 'right';
  ctx.fillText('Cód: 123456', width - 10, 20);

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, 25);
  ctx.lineTo(width - 8, 25);
  ctx.stroke();

  // Name
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
  ctx.fillText('MATEO ALEJANDRO', width / 2, 45);

  ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
  ctx.fillText('GÓMEZ PÉREZ', width / 2, 63);

  // Salón
  ctx.fillText('Salón: Zaqueos (Estático)', width / 2, 82);

  // Line
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 90);
  ctx.lineTo(width - 10, 90);
  ctx.stroke();

  // QR
  const qrSize = 84;
  const qrX = width - qrSize - 10;
  const qrY = 100;

  try {
    const qrCanvas = await generateQRCodeCanvas('123456', qrSize);
    ctx.drawImage(qrCanvas, qrX, qrY);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);
  } catch (err) {
    console.warn(err);
  }

  // Left column
  ctx.textAlign = 'left';
  ctx.font = '10px Arial, Helvetica, sans-serif';
  ctx.fillText('Reunión: Servicio Especial - Miércoles', 10, 108);

  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.fillText('Acudiente: Carlos Gómez (3001234567)', 10, 126);

  // Obs
  ctx.fillStyle = '#E4E4E7';
  ctx.fillRect(8, 136, qrX - 14, 15);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
  ctx.fillText('Obs: Lleva Bolso / Merienda', 10, 148);

  ctx.font = '9.5px Arial, Helvetica, sans-serif';
  ctx.fillText(`Fecha impresión: ${formatPrintDate()}`, 10, 226);

  return canvas;
};

/**
 * Prints a Canvas to Niimbot using @mmote/niimbluelib engine.
 */
export const printCanvasToNiimbot = async (
  canvas: HTMLCanvasElement,
  copies = 1,
): Promise<void> => {
  if (!niimbotClient.isConnected()) {
    throw new Error('Impresora Niimbot no conectada. Por favor conéctela en Ajustes.');
  }

  const meta = niimbotClient.getModelMetadata();
  const printDirection = meta?.printDirection ?? 'top';
  const taskType = niimbotClient.getPrintTaskType() || 'B1';

  const printTask = niimbotClient.abstraction.newPrintTask(taskType, {
    labelType: LabelType.WithGaps,
    density: meta?.densityDefault ?? 3,
    totalPages: copies,
  });

  const encodedImage = ImageEncoder.encodeCanvas(canvas, printDirection);

  await printTask.printInit();
  for (let i = 0; i < copies; i++) {
    await printTask.printPage(encodedImage, 1);
  }
  await printTask.waitForFinished();
  await printTask.printEnd();
};
