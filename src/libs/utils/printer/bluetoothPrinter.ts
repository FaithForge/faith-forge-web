/**
 * @fileoverview Universal Web Bluetooth Low Energy (BLE) Printer Service for Iglekids.
 * Integrates @mmote/niimbluelib for Niimbot label printers (B1, B21, D11, etc.) and native BLE for ESC/POS.
 */

import {
  buildKidRegistrationTicket,
  buildGuardianVoucherTicket,
  buildTestPrintTicket,
  KidTicketData,
} from './escposBuilder';
import {
  niimbotClient,
  renderKidTicketToCanvas,
  renderTestTicketToCanvas,
  printCanvasToNiimbot,
} from './niimbotDriver';

// Well-known BLE thermal and label printer service UUIDs
const KNOWN_PRINTER_SERVICES = [
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Niimbot Primary Service
  '0000fee7-0000-1000-8000-00805f9b34fb', // Niimbot / Tencent
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / Generic BLE Serial
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterStatus {
  supported: boolean;
  connected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  isNiimbot: boolean;
  error: string | null;
}

type StatusListener = (status: BluetoothPrinterStatus) => void;

class BluetoothPrinterService {
  private device: any | null = null;
  private server: any | null = null;
  private characteristic: any | null = null;
  private isNiimbotDevice = false;
  private connectedDeviceName: string | null = null;
  private listeners: Set<StatusListener> = new Set();
  private lastError: string | null = null;

  constructor() {
    niimbotClient.on('disconnect', () => {
      if (this.isNiimbotDevice) {
        this.handleDisconnected();
      }
    });
  }

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
    if (this.isNiimbotDevice) {
      return niimbotClient.isConnected();
    }
    return !!(this.server && this.server.connected && this.characteristic);
  }

  /**
   * Gets the connected device name.
   * @returns {string | null} Name or null.
   */
  public getDeviceName(): string | null {
    return this.connectedDeviceName || this.device?.name || (this.isNiimbotDevice ? 'Niimbot B1' : null);
  }

  /**
   * Checks if current device is a Niimbot printer.
   * @returns {boolean} True if Niimbot protocol is used.
   */
  public isNiimbot(): boolean {
    return this.isNiimbotDevice;
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
      isNiimbot: this.isNiimbotDevice,
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
   * Cancels any pending or active connection attempt immediately.
   */
  public cancelConnect(): void {
    this.handleDisconnected();
  }

  /**
   * Prompts user to select and pair a Bluetooth printer device via native browser UI.
   * Enforces strict timeout to prevent indefinite hangs.
   * @returns {Promise<string>} Device name on success.
   */
  public async requestAndConnect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth no está habilitado en este navegador. En Vivaldi/Chromium (Linux), abre vivaldi://flags/#enable-web-bluetooth y actívalo (Enabled), o pruébalo desde Chrome en Android.',
      );
    }

    this.cancelConnect();

    try {
      this.lastError = null;

      // Try connecting via NiimbotClient first (exact filters as niim.blue)
      try {
        const connInfo = await this.withTimeout(
          niimbotClient.connect(),
          15000,
          'Tiempo de espera agotado al seleccionar impresora.',
        );
        this.isNiimbotDevice = true;
        this.connectedDeviceName = connInfo.deviceName || 'Niimbot B1';
        try {
          await niimbotClient.fetchPrinterInfo();
        } catch {
          // Info fetch optional
        }
        this.notifyListeners();
        return this.connectedDeviceName;
      } catch (niimErr: any) {
        if (niimErr.name === 'NotFoundError' || niimErr.message?.includes('User cancelled')) {
          throw niimErr;
        }

        // Generic BLE printer fallback
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

        await this.withTimeout(
          this.connectToGenericDevice(),
          8000,
          'Tiempo de espera agotado al conectar con la impresora.',
        );

        this.connectedDeviceName = this.device.name || 'Impresora Bluetooth';
        this.notifyListeners();
        return this.connectedDeviceName || 'Impresora Bluetooth';
      }
    } catch (err: any) {
      this.handleDisconnected();
      this.lastError = err.message || 'Error al conectar con la impresora';
      this.notifyListeners();
      throw err;
    }
  }

  private async connectToGenericDevice(): Promise<void> {
    if (!this.device || !this.device.gatt) {
      throw new Error('Dispositivo Bluetooth no válido.');
    }

    this.server = await this.device.gatt.connect();

    let writeChar: any = null;
    const services = await this.server.getPrimaryServices();
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      } catch {
        // Continue
      }
    }

    if (!writeChar) {
      throw new Error(
        'No se encontró un canal de escritura compatible en el dispositivo seleccionado.',
      );
    }

    this.characteristic = writeChar;
    this.isNiimbotDevice = false;
    this.lastError = null;
  }

  private handleDisconnected(): void {
    if (this.isNiimbotDevice) {
      try {
        niimbotClient.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.device?.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // Ignore
      }
    }
    this.characteristic = null;
    this.server = null;
    this.device = null;
    this.isNiimbotDevice = false;
    this.connectedDeviceName = null;
    this.notifyListeners();
  }

  /**
   * Disconnects the active Bluetooth device.
   */
  public async disconnect(): Promise<void> {
    this.handleDisconnected();
  }

  /**
   * Sends raw binary buffer to printer in chunks (for standard ESC/POS).
   * @param {Uint8Array} data Binary ESC/POS bytes.
   * @param {number} [chunkSize=100] Bytes per chunk.
   * @returns {Promise<boolean>} Success status.
   */
  public async printRaw(data: Uint8Array, chunkSize = 100): Promise<boolean> {
    if (!this.isConnected() || !this.characteristic) {
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
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    return true;
  }

  /**
   * Prints full registration label and guardian voucher for a child.
   * Automatically adapts to Niimbot (@mmote/niimbluelib) or standard POS (ESC/POS).
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
    if (!this.isConnected()) {
      throw new Error('Impresora Bluetooth no conectada.');
    }

    if (this.isNiimbotDevice) {
      const canvas = await renderKidTicketToCanvas(data);
      await printCanvasToNiimbot(canvas, Math.max(1, copies));
      return true;
    }

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
   * Prints diagnostic test page on connected device (Niimbot or ESC/POS).
   * @returns {Promise<boolean>} Success status.
   */
  public async printTestTicket(): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Impresora Bluetooth no conectada.');
    }

    const deviceName = this.getDeviceName() || (this.isNiimbotDevice ? 'Niimbot B1' : 'Impresora Térmica');

    if (this.isNiimbotDevice) {
      const testCanvas = await renderTestTicketToCanvas(deviceName);
      await printCanvasToNiimbot(testCanvas, 1);
      return true;
    }

    const testBuffer = buildTestPrintTicket(deviceName);
    return await this.printRaw(testBuffer);
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMsg)), ms),
      ),
    ]);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
export default bluetoothPrinter;
