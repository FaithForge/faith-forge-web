/**
 * @fileoverview ESC/POS Command generator and ticket formatter for portable thermal printers (58mm/80mm).
 * Produces byte command streams conforming to the standard ESC/POS protocol for text formatting,
 * alignment, font scaling, bar/QR codes, line feeding, and paper cutting.
 */

export type EscPosAlign = 'left' | 'center' | 'right';
export type EscPosFontSize = 'normal' | 'double-height' | 'double-width' | 'large' | 'title';

/**
 * Data payload required to render a kid registration ticket and voucher.
 */
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
 * Supports chaining syntax for concise ticket construction.
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /**
   * Initializes the printer with default hardware settings and selects character code table CP437.
   *
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public init(): EscPosBuilder {
    // ESC @ (Initialize printer hardware)
    this.buffer.push(0x1b, 0x40);
    // ESC t 0 (Code table CP437 default)
    this.buffer.push(0x1b, 0x74, 0x00);
    return this;
  }

  /**
   * Sets text alignment mode (left, center, right).
   *
   * @param {EscPosAlign} align - Alignment option: 'left', 'center', or 'right'.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public align(align: EscPosAlign): EscPosBuilder {
    const val = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val);
    return this;
  }

  /**
   * Toggles emphasized (bold) text formatting.
   *
   * @param {boolean} [enable=true] - Whether bold mode is enabled.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public bold(enable = true): EscPosBuilder {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  /**
   * Toggles inverted colors (white text on black background).
   *
   * @param {boolean} [enable=true] - Whether inverted mode is enabled.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public invert(enable = true): EscPosBuilder {
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0);
    return this;
  }

  /**
   * Sets font scaling mode (normal, double-height, double-width, large, title).
   *
   * @param {EscPosFontSize} size - Desired font size preset.
   * @returns {EscPosBuilder} Current builder instance for chaining.
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
   * Appends raw text encoded as Latin1 / ASCII bytes.
   * Diacritics and accented characters are automatically normalized to ensure clean rendering.
   *
   * @param {string} text - The text string to write.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public text(text: string): EscPosBuilder {
    const sanitized = this.sanitizeText(text);
    for (let i = 0; i < sanitized.length; i++) {
      this.buffer.push(sanitized.charCodeAt(i) & 0xff);
    }
    return this;
  }

  /**
   * Appends text followed by a standard line feed (0x0A).
   *
   * @param {string} [text=''] - Text line to print. Defaults to an empty line.
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public line(text = ''): EscPosBuilder {
    this.text(text);
    this.buffer.push(0x0a);
    return this;
  }

  /**
   * Appends a centered horizontal separator line using the specified character.
   *
   * @param {string} [char='-'] - Single character to repeat.
   * @param {number} [length=32] - Total width count (32 characters for 58mm, 48 for 80mm).
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public separator(char = '-', length = 32): EscPosBuilder {
    this.align('center');
    this.size('normal');
    this.bold(false);
    this.line(char.repeat(length));
    return this;
  }

  /**
   * Appends ESC/POS standard Model 2 QR code generation commands.
   *
   * @param {string} data - Content string to encode into the QR code.
   * @param {number} [size=6] - Module size in dots (range 1-16).
   * @returns {EscPosBuilder} Current builder instance for chaining.
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
    // 4. Store Data in QR Symbol Storage Area
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < sanitized.length; i++) {
      this.buffer.push(sanitized.charCodeAt(i) & 0xff);
    }
    // 5. Print QR Code from Symbol Storage Area
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  /**
   * Feeds paper by the specified number of lines.
   *
   * @param {number} [lines=3] - Line feed count (minimum 1).
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public feed(lines = 3): EscPosBuilder {
    this.buffer.push(0x1b, 0x64, Math.max(1, lines));
    return this;
  }

  /**
   * Sends line feeds followed by a paper cut command (GS V 66 0).
   *
   * @returns {EscPosBuilder} Current builder instance for chaining.
   */
  public cut(): EscPosBuilder {
    this.feed(3);
    // GS V 66 0 (Cut paper command)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * Returns the generated binary command sequence as a Uint8Array.
   *
   * @returns {Uint8Array} Binary commands ready for Bluetooth GATT transmission or raw socket output.
   */
  public getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Sanitizes text to prevent character encoding issues on thermal printers.
   * Replaces common Latin accented characters and strips unsupported non-ASCII glyphs.
   *
   * @param {string} str - Raw input string.
   * @returns {string} Sanitized string safe for thermal CP437 output.
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
 * Builds the standard kid identification sticker / ticket.
 * Includes child name, classroom / group, volunteer badge if applicable, security code,
 * medical warnings / observations, guardian contact, and date.
 *
 * @param {KidTicketData} data - Information of the registered child.
 * @returns {Uint8Array} Byte buffer ready for thermal printer transmission.
 */
export const buildKidRegistrationTicket = (data: KidTicketData): Uint8Array => {
  const builder = new EscPosBuilder();
  const dateStr =
    data.date ||
    new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Header
  const headerTitle = (data.campusName || 'REGISTRO DE NINOS').toUpperCase();
  builder
    .align('center')
    .size('large')
    .bold(true)
    .line(headerTitle)
    .size('normal')
    .bold(false)
    .line(data.campusName ? 'Registro Infantil' : '')
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
 * Builds the guardian claim voucher ticket containing child name, classroom,
 * guardian details, and prominently displayed pickup security code.
 *
 * @param {KidTicketData} data - Child and security code information.
 * @returns {Uint8Array} Byte buffer ready for thermal printer transmission.
 */
export const buildGuardianVoucherTicket = (data: KidTicketData): Uint8Array => {
  const builder = new EscPosBuilder();
  const dateStr =
    data.date ||
    new Date().toLocaleDateString('es-CO', {
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
    .line('COMPROBANTE DE ENTREGA')
    .size('normal')
    .bold(false)
    .line(data.campusName || 'Registro Infantil')
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
 * Builds a diagnostic test print ticket for Bluetooth thermal printer verification.
 * Verifies character set, text alignment, inversion, font sizing, and cut capabilities.
 *
 * @param {string} [printerName='Impresora Bluetooth'] - Device identifier or name.
 * @returns {Uint8Array} Byte buffer ready for thermal printer transmission.
 */
export const buildTestPrintTicket = (printerName = 'Impresora Bluetooth'): Uint8Array => {
  const builder = new EscPosBuilder();
  const now = new Date().toLocaleString('es-CO');

  builder
    .align('center')
    .size('large')
    .bold(true)
    .line('TEST DE IMPRESION')
    .size('normal')
    .bold(false)
    .line('CONEXION BLUETOOTH')
    .separator('=', 32)
    .align('left')
    .line(`Dispositivo: ${printerName}`)
    .line('Estado: CONECTADO OK')
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
