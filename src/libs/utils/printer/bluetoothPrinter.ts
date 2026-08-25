/**
 * @fileoverview Web Bluetooth Low Energy (BLE) Printer Service for Iglekids.
 * Manages device pairing, GATT connection, chunked binary transmission, and print jobs.
 */

import {
  buildKidRegistrationTicket,
  buildGuardianVoucherTicket,
  buildTestPrintTicket,
  KidTicketData,
} from './escposBuilder';

// Well-known BLE thermal printer service UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / Generic BLE Serial
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  'e7810a06-736b-4f3a-86ac-109f536c2002', // POS / Label service
  0xffe0,
  0x18f0,
];

export interface BluetoothPrinterStatus {
  supported: boolean;
  connected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  error: string | null;
}

type StatusListener = (status: BluetoothPrinterStatus) => void;

class BluetoothPrinterService {
  private device: any | null = null;
  private server: any | null = null;
  private characteristic: any | null = null;
  private listeners: Set<StatusListener> = new Set();
  private lastError: string | null = null;

  /**
   * Checks if Web Bluetooth API is supported in current browser environment.
   * @returns {boolean} True if navigator.bluetooth is available.
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Checks if a device is currently connected with an active GATT server.
   * @returns {boolean} Connection status.
   */
  public isConnected(): boolean {
    return !!(this.server && this.server.connected && this.characteristic);
  }

  /**
   * Gets the connected device name.
   * @returns {string | null} Name or null.
   */
  public getDeviceName(): string | null {
    return this.device?.name || null;
  }

  /**
   * Gets current printer status snapshot.
   * @returns {BluetoothPrinterStatus} Status object.
   */
  public getStatus(): BluetoothPrinterStatus {
    return {
      supported: this.isSupported(),
      connected: this.isConnected(),
      deviceName: this.getDeviceName(),
      deviceId: this.device?.id || null,
      error: this.lastError,
    };
  }

  /**
   * Subscribes to connection status changes.
   * @param {StatusListener} listener Callback function.
   * @returns {() => void} Unsubscribe function.
   */
  public onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('[BluetoothPrinter] Error in status listener:', err);
      }
    });
  }

  /**
   * Prompts user to select and pair a Bluetooth printer device via native browser UI.
   * @returns {Promise<string>} Device name on success.
   */
  public async requestAndConnect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth no es soportado en este navegador. Utiliza Chrome o Edge en Android o PC.',
      );
    }

    try {
      this.lastError = null;

      // Request device with printer service filters + acceptAllDevices fallback
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('No se seleccionó ningún dispositivo Bluetooth.');
      }

      this.device = device;
      this.device.addEventListener(
        'gattserverdisconnected',
        this.handleDisconnected.bind(this),
      );

      await this.connectToDevice();
      return this.device.name || 'Impresora Bluetooth';
    } catch (err: any) {
      this.lastError = err.message || 'Error al conectar con la impresora';
      this.notifyListeners();
      throw err;
    }
  }

  /**
   * Connects to GATT server and discovers writable characteristic.
   * @private
   */
  private async connectToDevice(): Promise<void> {
    if (!this.device || !this.device.gatt) {
      throw new Error('Dispositivo Bluetooth no válido.');
    }

    // Connect GATT
    this.server = await this.device.gatt.connect();

    // Find services
    const services = await this.server.getPrimaryServices();
    let writeChar: any = null;

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (
            char.properties.write ||
            char.properties.writeWithoutResponse
          ) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      } catch {
        // Continue checking other services
      }
    }

    if (!writeChar) {
      throw new Error(
        'No se encontró una característica de escritura válida en la impresora seleccionada.',
      );
    }

    this.characteristic = writeChar;
    this.lastError = null;
    this.notifyListeners();
  }

  private handleDisconnected(): void {
    this.characteristic = null;
    this.server = null;
    this.notifyListeners();
  }

  /**
   * Reconnects to the previously paired device if GATT was dropped.
   * @returns {Promise<boolean>} True if reconnected.
   */
  public async ensureConnected(): Promise<boolean> {
    if (this.isConnected()) return true;
    if (!this.device || !this.device.gatt) return false;

    try {
      await this.connectToDevice();
      return this.isConnected();
    } catch (err: any) {
      this.lastError = err.message || 'No se pudo reconectar';
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Disconnects the active Bluetooth device.
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch (err) {
      console.warn('[BluetoothPrinter] Disconnect error:', err);
    } finally {
      this.handleDisconnected();
    }
  }

  /**
   * Sends raw binary buffer to printer in chunks (to respect BLE MTU limits).
   * @param {Uint8Array} data Binary ESC/POS bytes.
   * @param {number} [chunkSize=100] Bytes per chunk.
   * @returns {Promise<boolean>} Success status.
   */
  public async printRaw(data: Uint8Array, chunkSize = 100): Promise<boolean> {
    const isReady = await this.ensureConnected();
    if (!isReady || !this.characteristic) {
      throw new Error(
        'Impresora Bluetooth no conectada. Por favor vincúlela en Ajustes.',
      );
    }

    const totalLength = data.length;
    let offset = 0;

    while (offset < totalLength) {
      const chunk = data.slice(offset, offset + chunkSize);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      offset += chunkSize;
      // Small pause to allow printer buffer to process
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    return true;
  }

  /**
   * Prints full registration label and guardian voucher for a child.
   * @param {KidTicketData} data Child ticket data.
   * @param {number} [copies=1] Number of kid label copies.
   * @param {boolean} [printGuardianVoucher=true] Whether to print guardian voucher.
   * @returns {Promise<boolean>} Success status.
   */
  public async printKidTicket(
    data: KidTicketData,
    copies = 1,
    printGuardianVoucher = true,
  ): Promise<boolean> {
    const kidTicketBuffer = buildKidRegistrationTicket(data);

    for (let i = 0; i < Math.max(1, copies); i++) {
      await this.printRaw(kidTicketBuffer);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (printGuardianVoucher && data.securityCode) {
      const voucherBuffer = buildGuardianVoucherTicket(data);
      await this.printRaw(voucherBuffer);
    }

    return true;
  }

  /**
   * Prints diagnostic test page.
   * @returns {Promise<boolean>} Success status.
   */
  public async printTestTicket(): Promise<boolean> {
    const deviceName = this.getDeviceName() || 'Impresora Bluetooth';
    const testBuffer = buildTestPrintTicket(deviceName);
    return await this.printRaw(testBuffer);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
export default bluetoothPrinter;
