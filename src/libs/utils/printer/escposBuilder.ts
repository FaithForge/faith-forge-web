/**
 * @fileoverview ESC/POS Command generator and ticket formatter for portable thermal printers (58mm/80mm).
 */

export type EscPosAlign = 'left' | 'center' | 'right';
export type EscPosFontSize = 'normal' | 'double-height' | 'double-width' | 'large' | 'title';

export interface KidTicketData {
  kidName: string;
  kidGroup: string;
  securityCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  observation?: string;
  medicalConditions?: string[];
  campusName?: string;
  meetingName?: string;
  date?: string;
  isVolunteer?: boolean;
  gender?: string;
}

/**
 * Helper class to construct binary ESC/POS byte commands for thermal printers.
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /**
   * Initializes the printer with default settings.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public init(): EscPosBuilder {
    // ESC @ (Initialize printer)
    this.buffer.push(0x1b, 0x40);
    // Code table CP437 or UTF-8 depending on printer
    this.buffer.push(0x1b, 0x74, 0x00);
    return this;
  }

  /**
   * Sets text alignment (left, center, right).
   * @param {EscPosAlign} align Alignment option.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public align(align: EscPosAlign): EscPosBuilder {
    const val = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val);
    return this;
  }

  /**
   * Toggles bold text.
   * @param {boolean} enable Whether bold is active.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public bold(enable = true): EscPosBuilder {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  /**
   * Toggles inverted colors (white on black).
   * @param {boolean} enable Whether inversion is active.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public invert(enable = true): EscPosBuilder {
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0);
    return this;
  }

  /**
   * Sets font size scaling.
   * @param {EscPosFontSize} size Font size scale.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public size(size: EscPosFontSize): EscPosBuilder {
    let byte = 0x00;
    switch (size) {
      case 'double-height':
        byte = 0x01;
        break;
      case 'double-width':
        byte = 0x10;
        break;
      case 'large':
        byte = 0x11;
        break;
      case 'title':
        byte = 0x22;
        break;
      case 'normal':
      default:
        byte = 0x00;
        break;
    }
    this.buffer.push(0x1d, 0x21, byte);
    return this;
  }

  /**
   * Appends raw text encoded as latin1 / ASCII byte values.
   * Replaces common accented characters to ensure clean display on thermal printers.
   * @param {string} text Text string to write.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public text(text: string): EscPosBuilder {
    const sanitized = this.sanitizeText(text);
    for (let i = 0; i < sanitized.length; i++) {
      this.buffer.push(sanitized.charCodeAt(i) & 0xff);
    }
    return this;
  }

  /**
   * Appends text followed by a newline.
   * @param {string} text Text to print.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public line(text = ''): EscPosBuilder {
    this.text(text);
    this.buffer.push(0x0a);
    return this;
  }

  /**
   * Appends a horizontal separator line.
   * @param {string} [char='-'] Character to repeat.
   * @param {number} [length=32] Width (32 for 58mm, 48 for 80mm).
   * @returns {EscPosBuilder} Current builder instance.
   */
  public separator(char = '-', length = 32): EscPosBuilder {
    this.align('center');
    this.size('normal');
    this.bold(false);
    this.line(char.repeat(length));
    return this;
  }

  /**
   * Appends ESC/POS standard QR code commands.
   * @param {string} data Content string for QR.
   * @param {number} [size=6] Module size (1-16).
   * @returns {EscPosBuilder} Current builder instance.
   */
  public qrCode(data: string, size = 6): EscPosBuilder {
    this.align('center');
    const sanitized = this.sanitizeText(data);
    const length = sanitized.length + 3;
    const pL = length & 0xff;
    const pH = (length >> 8) & 0xff;

    // 1. Set QR Model 2
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Set Module Size
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);
    // 3. Set Error Correction Level M (0x31)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Store Data
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < sanitized.length; i++) {
      this.buffer.push(sanitized.charCodeAt(i) & 0xff);
    }
    // 5. Print QR Code
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  /**
   * Feeds paper by specified lines.
   * @param {number} [lines=3] Line feed count.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public feed(lines = 3): EscPosBuilder {
    this.buffer.push(0x1b, 0x64, Math.max(1, lines));
    return this;
  }

  /**
   * Sends partial/full cut command.
   * @returns {EscPosBuilder} Current builder instance.
   */
  public cut(): EscPosBuilder {
    this.feed(3);
    // GS V 66 0 (Cut paper)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * Returns generated byte array.
   * @returns {Uint8Array} Binary commands ready for Bluetooth GATT transmission.
   */
  public getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Cleans text to prevent character encoding issues on thermal printers.
   * @private
   */
  private sanitizeText(str: string): string {
    if (!str) return '';
    return str
      .replace(/[áäàâ]/g, 'a')
      .replace(/[ÁÄÀÂ]/g, 'A')
      .replace(/[éëèê]/g, 'e')
      .replace(/[ÉËÈÊ]/g, 'E')
      .replace(/[íïìî]/g, 'i')
      .replace(/[ÍÏÌÎ]/g, 'I')
      .replace(/[óöòô]/g, 'o')
      .replace(/[ÓÖÒÔ]/g, 'O')
      .replace(/[úüùû]/g, 'u')
      .replace(/[ÚÜÙÛ]/g, 'U')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N')
      .replace(/[^\x20-\x7E\n\r]/g, '');
  }
}

/**
 * Builds standard Iglekids registration label.
 * @param {KidTicketData} data Information of the registered child.
 * @returns {Uint8Array} Byte buffer ready to print.
 */
export const buildKidRegistrationTicket = (data: KidTicketData): Uint8Array => {
  const builder = new EscPosBuilder();
  const dateStr = data.date || new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header
  builder
    .align('center')
    .size('large')
    .bold(true)
    .line('IGLEKIDS')
    .size('normal')
    .bold(false)
    .line(data.campusName || 'Registro Infantil')
    .line(data.meetingName || '')
    .separator('=', 32);

  // Kid Name (Prominent)
  builder
    .align('center')
    .size('double-height')
    .bold(true)
    .line(data.kidName.toUpperCase())
    .size('normal')
    .bold(false)
    .line(`Salón: ${data.kidGroup || 'General'}`);

  if (data.isVolunteer) {
    builder
      .align('center')
      .invert(true)
      .bold(true)
      .line(' VOLUNTARIO / SERVIDOR ')
      .invert(false)
      .bold(false);
  }

  // Security Code (Prominent box / inverted)
  if (data.securityCode) {
    builder
      .separator('-', 32)
      .align('center')
      .bold(true)
      .line('CODIGO DE SEGURIDAD')
      .size('large')
      .invert(true)
      .line(`  ${data.securityCode}  `)
      .invert(false)
      .size('normal')
      .bold(false);
  }

  // Observations / Medical
  if (data.observation || (data.medicalConditions && data.medicalConditions.length > 0)) {
    builder
      .separator('-', 32)
      .align('left')
      .bold(true)
      .line('OBSERVACIONES / ALERGIAS:');

    if (data.observation) {
      builder.bold(false).line(`* ${data.observation}`);
    }
    if (data.medicalConditions) {
      data.medicalConditions.forEach((cond) => {
        builder.bold(false).line(`* ${cond}`);
      });
    }
  }

  // Guardian info
  if (data.guardianName) {
    builder
      .separator('-', 32)
      .align('left')
      .line(`Tutor: ${data.guardianName}`)
      .line(`Tel: ${data.guardianPhone || 'N/A'}`);
  }

  // Footer & Timestamp
  builder
    .separator('=', 32)
    .align('center')
    .size('normal')
    .line(dateStr)
    .line('¡Cuidando con amor el futuro!')
    .cut();

  return builder.getBuffer();
};

/**
 * Builds guardian voucher ticket (for picking up the child).
 * @param {KidTicketData} data Child and security code info.
 * @returns {Uint8Array} Byte buffer ready to print.
 */
export const buildGuardianVoucherTicket = (data: KidTicketData): Uint8Array => {
  const builder = new EscPosBuilder();
  const dateStr = data.date || new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  builder
    .align('center')
    .size('large')
    .bold(true)
    .line('IGLEKIDS')
    .size('normal')
    .bold(false)
    .line('COMPROBANTE DE ENTREGA')
    .separator('=', 32)
    .align('left')
    .line(`Nino: ${data.kidName}`)
    .line(`Aula: ${data.kidGroup}`)
    .line(`Tutor: ${data.guardianName || 'Acudiente'}`)
    .separator('-', 32)
    .align('center')
    .line('MUESTRE ESTE CODIGO AL RETIRAR:')
    .size('title')
    .bold(true)
    .invert(true)
    .line(` ${data.securityCode || '---'} `)
    .invert(false)
    .size('normal')
    .bold(false)
    .separator('=', 32)
    .line(dateStr)
    .cut();

  return builder.getBuffer();
};

/**
 * Builds a diagnostic test print ticket for Bluetooth printer verification.
 * @param {string} [printerName] Device name.
 * @returns {Uint8Array} Byte buffer ready to print.
 */
export const buildTestPrintTicket = (printerName = 'Impresora Bluetooth'): Uint8Array => {
  const builder = new EscPosBuilder();
  const now = new Date().toLocaleString('es-CO');

  builder
    .align('center')
    .size('large')
    .bold(true)
    .line('IGLEKIDS')
    .size('normal')
    .bold(false)
    .line('TEST DE IMPRESION BLUETOOTH')
    .separator('=', 32)
    .align('left')
    .line(`Dispositivo: ${printerName}`)
    .line(`Estado: CONECTADO OK`)
    .line(`Fecha: ${now}`)
    .separator('-', 32)
    .align('center')
    .size('double-height')
    .bold(true)
    .line('PRUEBA EXITOSA')
    .size('normal')
    .bold(false)
    .line('Impresion ESC/POS operativa')
    .separator('=', 32)
    .feed(2)
    .cut();

  return builder.getBuffer();
};
