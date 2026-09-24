/**
 * @fileoverview Universal Web Bluetooth Low Energy (BLE) Printer Service for kids registration.
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

/**
 * Characteristic property flags exposed by a GATT characteristic.
 */
export interface IWebBluetoothCharacteristicProperties {
  write?: boolean;
  writeWithoutResponse?: boolean;
}

/**
 * Minimal Web Bluetooth GATT Characteristic representation.
 */
export interface IWebBluetoothCharacteristic {
  properties: IWebBluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

/**
 * Minimal Web Bluetooth GATT Service representation.
 */
export interface IWebBluetoothService {
  getCharacteristics(): Promise<IWebBluetoothCharacteristic[]>;
}

/**
 * Minimal Web Bluetooth GATT Server representation.
 */
export interface IWebBluetoothGATTServer {
  connected: boolean;
  connect(): Promise<IWebBluetoothGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<IWebBluetoothService[]>;
}

/**
 * Minimal Web Bluetooth Device representation.
 */
export interface IWebBluetoothDevice {
  id: string;
  name?: string;
  gatt?: IWebBluetoothGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

/**
 * Extended Navigator interface exposing the standard Web Bluetooth API.
 */
export interface IWebBluetoothNavigator {
  bluetooth: {
    requestDevice(options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }): Promise<IWebBluetoothDevice>;
  };
}

/**
 * Snapshot of current Bluetooth printer connection state.
 */
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
  printTicket(
    printer: BluetoothPrinterService,
    data: KidTicketData,
    copies?: number,
    printGuardianVoucher?: boolean,
  ): Promise<boolean>;
  printTest(printer: BluetoothPrinterService, deviceName: string): Promise<boolean>;
}

/**
 * Default ESC/POS thermal printer driver using ESC/POS byte streams.
 */
class DefaultEscPosDriver implements IBluetoothPrinterDriver {
  public readonly name = 'ESC/POS';

  /**
   * Dispatches binary ticket printing commands to the connected Bluetooth thermal printer.
   *
   * @param {BluetoothPrinterService} printer - The active printer service instance.
   * @param {KidTicketData} data - Kid ticket payload.
   * @param {number} [copies=1] - Number of kid label copies to generate.
   * @param {boolean} [printGuardianVoucher=true] - Whether to generate and print guardian claim voucher.
   * @returns {Promise<boolean>} True when print stream completes successfully.
   */
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

  /**
   * Prints a diagnostic test ticket on the connected device.
   *
   * @param {BluetoothPrinterService} printer - Active printer service instance.
   * @param {string} deviceName - Human-readable printer name.
   * @returns {Promise<boolean>} True when test print command finishes.
   */
  public async printTest(printer: BluetoothPrinterService, deviceName: string): Promise<boolean> {
    const testBuffer = buildTestPrintTicket(deviceName);
    return await printer.printRaw(testBuffer);
  }
}

/**
 * Service managing Bluetooth BLE connections and label printing.
 */
class BluetoothPrinterService {
  private device: IWebBluetoothDevice | null = null;
  private server: IWebBluetoothGATTServer | null = null;
  private characteristic: IWebBluetoothCharacteristic | null = null;
  private connectedDeviceName: string | null = null;
  private listeners: Set<StatusListener> = new Set();
  private lastError: string | null = null;
  private activeDriver: IBluetoothPrinterDriver = new DefaultEscPosDriver();

  /**
   * Registers a custom printer driver for specialized hardware.
   *
   * @param {IBluetoothPrinterDriver} driver - The driver implementation.
   * @returns {void}
   */
  public setDriver(driver: IBluetoothPrinterDriver): void {
    this.activeDriver = driver;
    this.notifyListeners();
  }

  /**
   * Checks if Web Bluetooth API is supported in current browser environment.
   *
   * @returns {boolean} True if navigator.bluetooth is available.
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Checks if a device is currently connected with an active GATT server and writable characteristic.
   *
   * @returns {boolean} Connection status.
   */
  public isConnected(): boolean {
    return !!(this.server && this.server.connected && this.characteristic);
  }

  /**
   * Gets the connected device name.
   *
   * @returns {string | null} Name or null when disconnected.
   */
  public getDeviceName(): string | null {
    return this.connectedDeviceName || this.device?.name || null;
  }

  /**
   * Gets current printer status snapshot.
   *
   * @returns {BluetoothPrinterStatus} Status snapshot object.
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
   *
   * @param {StatusListener} listener - Callback function receiving status updates.
   * @returns {() => void} Unsubscribe function to remove listener.
   */
  public onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  /**
   * Dispatches current connection status to all registered listeners.
   * @private
   */
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
   * Cancels any pending or active connection attempt immediately and resets state.
   *
   * @returns {void}
   */
  public cancelConnect(): void {
    this.handleDisconnected();
  }

  /**
   * Prompts user to select and pair a Bluetooth printer device via native browser UI.
   * Enforces strict timeout to prevent indefinite connection hangs.
   *
   * @returns {Promise<string>} Connected device name on success.
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

      const nav = navigator as unknown as IWebBluetoothNavigator;
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
    } catch (err: unknown) {
      this.handleDisconnected();
      const message = err instanceof Error ? err.message : 'Error al conectar con la impresora';
      this.lastError = message;
      this.notifyListeners();
      throw err;
    }
  }

  /**
   * Connects to GATT server on the selected Bluetooth device and discovers writable characteristics.
   * @private
   */
  private async connectToDevice(): Promise<void> {
    if (!this.device || !this.device.gatt) {
      throw new Error('Dispositivo Bluetooth no válido.');
    }

    this.server = await this.device.gatt.connect();

    let writeChar: IWebBluetoothCharacteristic | null = null;
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

  /**
   * Cleans up connection references when a GATT disconnection occurs.
   * @private
   */
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
   * Disconnects the active Bluetooth device and closes GATT server connection.
   *
   * @returns {Promise<void>} Resolves when disconnection is complete.
   */
  public async disconnect(): Promise<void> {
    this.handleDisconnected();
  }

  /**
   * Sends raw binary buffer to printer in chunks (for standard ESC/POS).
   *
   * @param {Uint8Array} data - Binary ESC/POS bytes.
   * @param {number} [chunkSize=100] - Bytes per chunk.
   * @returns {Promise<boolean>} True when entire buffer is transmitted.
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
   *
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
   *
   * @returns {Promise<boolean>} Success status.
   */
  public async printTestTicket(): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Impresora Bluetooth no conectada.');
    }

    const deviceName = this.getDeviceName() || 'Impresora Térmica';
    return await this.activeDriver.printTest(this, deviceName);
  }

  /**
   * Wraps an asynchronous operation with an execution timeout.
   *
   * @template T
   * @param {Promise<T>} promise - The promise to execute.
   * @param {number} ms - Milliseconds before timeout rejection.
   * @param {string} errorMsg - Error description on timeout.
   * @returns {Promise<T>} Promise resolved value.
   * @private
   */
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
