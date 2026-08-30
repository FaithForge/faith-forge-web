/**
 * @fileoverview Universal Web Bluetooth Low Energy (BLE) Printer Service for Iglekids.
 * Provides native BLE connectivity for ESC/POS thermal printers and an extensible
 * driver architecture (IBluetoothPrinterDriver) for future Bluetooth printer models.
 */

import {
  buildKidRegistrationTicket,
  buildGuardianVoucherTicket,
  buildTestPrintTicket,
  KidTicketData,
} from './escposBuilder';

// Well-known BLE thermal and label printer service UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / Generic BLE Serial
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000fee7-0000-1000-8000-00805f9b34fb', // BLE Serial alternative
  '0000ff00-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterStatus {
  supported: boolean;
  connected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  driverType: 'ESC/POS' | string;
  error: string | null;
}

export type StatusListener = (status: BluetoothPrinterStatus) => void;

/**
 * Extensible interface for custom Bluetooth printer drivers.
 * Implement this interface when integrating proprietary or specialized printer protocols.
 */
export interface IBluetoothPrinterDriver {
  readonly name: string;
  printTicket(printer: BluetoothPrinterService, data: KidTicketData, copies?: number, printGuardianVoucher?: boolean): Promise<boolean>;
  printTest(printer: BluetoothPrinterService, deviceName: string): Promise<boolean>;
}

/**
 * Default ESC/POS thermal printer driver using ESC/POS byte streams.
 */
class DefaultEscPosDriver implements IBluetoothPrinterDriver {
  public readonly name = 'ESC/POS';

  public async printTicket(
    printer: BluetoothPrinterService,
    data: KidTicketData,
    copies = 1,
    printGuardianVoucher = true,
  ): Promise<boolean> {
    const kidTicketBuffer = buildKidRegistrationTicket(data);
    for (let i = 0; i < Math.max(1, copies); i++) {
      await printer.printRaw(kidTicketBuffer);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (printGuardianVoucher && data.securityCode) {
      const voucherBuffer = buildGuardianVoucherTicket(data);
      await printer.printRaw(voucherBuffer);
    }

    return true;
  }

  public async printTest(printer: BluetoothPrinterService, deviceName: string): Promise<boolean> {
    const testBuffer = buildTestPrintTicket(deviceName);
    return await printer.printRaw(testBuffer);
  }
}

/**
 * Service managing Bluetooth BLE connections and label printing.
 */
class BluetoothPrinterService {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private device: any | null = null;
  private server: any | null = null;
  private characteristic: any | null = null;
  private connectedDeviceName: string | null = null;
  private listeners: Set<StatusListener> = new Set();
  private lastError: string | null = null;
  private activeDriver: IBluetoothPrinterDriver = new DefaultEscPosDriver();

  /**
   * Registers a custom printer driver for specialized hardware.
   * @param {IBluetoothPrinterDriver} driver - The driver implementation.
   */
  public setDriver(driver: IBluetoothPrinterDriver): void {
    this.activeDriver = driver;
    this.notifyListeners();
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
    return !!(this.server && this.server.connected && this.characteristic);
  }

  /**
   * Gets the connected device name.
   * @returns {string | null} Name or null.
   */
  public getDeviceName(): string | null {
    return this.connectedDeviceName || this.device?.name || null;
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
      driverType: this.activeDriver.name,
      error: this.lastError,
    };
  }

  /**
   * Subscribes to connection status changes.
   * @param {StatusListener} listener - Callback function.
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
        'Web Bluetooth no está habilitado en este navegador. En Chrome/Chromium, verifica que Web Bluetooth esté habilitado, o pruébalo desde Chrome en Android.',
      );
    }

    this.cancelConnect();

    try {
      this.lastError = null;

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
        this.connectToDevice(),
        10000,
        'Tiempo de espera agotado al conectar con la impresora.',
      );

      this.connectedDeviceName = this.device.name || 'Impresora Bluetooth';
      this.notifyListeners();
      return this.connectedDeviceName || 'Impresora Bluetooth';
    } catch (err: any) {
      this.handleDisconnected();
      this.lastError = err.message || 'Error al conectar con la impresora';
      this.notifyListeners();
      throw err;
    }
  }

  private async connectToDevice(): Promise<void> {
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
        // Continue searching in next service
      }
    }

    if (!writeChar) {
      throw new Error(
        'No se encontró un canal de escritura compatible en el dispositivo seleccionado.',
      );
    }

    this.characteristic = writeChar;
    this.lastError = null;
  }

  private handleDisconnected(): void {
    if (this.device?.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // Ignore disconnection cleanup errors
      }
    }
    this.characteristic = null;
    this.server = null;
    this.device = null;
    this.connectedDeviceName = null;
    this.notifyListeners();
  }

  /**
   * Disconnects the active Bluetooth device.
   * @returns {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    this.handleDisconnected();
  }

  /**
   * Sends raw binary buffer to printer in chunks (for standard ESC/POS).
   * @param {Uint8Array} data - Binary ESC/POS bytes.
   * @param {number} [chunkSize=100] - Bytes per chunk.
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
   * Delegates formatting and transmission to the active printer driver.
   * @param {KidTicketData} data - Child ticket data.
   * @param {number} [copies=1] - Number of kid label copies.
   * @param {boolean} [printGuardianVoucher=true] - Whether to print guardian voucher.
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

    return await this.activeDriver.printTicket(this, data, copies, printGuardianVoucher);
  }

  /**
   * Prints diagnostic test page on connected device.
   * @returns {Promise<boolean>} Success status.
   */
  public async printTestTicket(): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Impresora Bluetooth no conectada.');
    }

    const deviceName = this.getDeviceName() || 'Impresora Térmica';
    return await this.activeDriver.printTest(this, deviceName);
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
