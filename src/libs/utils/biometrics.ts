import { isTokenExpired } from './jwt';
import { formatPersonShortName } from './text';

const BIOMETRIC_STORAGE_KEY = 'iglekids_biometric_session';

export interface BiometricSessionData {
  username: string;
  user: any;
  token?: string;
  encryptedPassword?: string;
  iv?: string;
  salt?: string;
  credentialId: string;
  registeredAt: number;
}

export interface BiometricAuthResult {
  username: string;
  user: any;
  token?: string;
  password?: string;
  tokenValid: boolean;
}

/**
 * Derives an AES-GCM CryptoKey using PBKDF2 from the credentialId and salt.
 *
 * @param {string} credentialId - The unique credential ID used as secret seed.
 * @param {Uint8Array} salt - The cryptographic salt for key derivation.
 * @returns {Promise<CryptoKey>} The derived AES-GCM crypto key.
 */
const deriveKeyFromCredentialId = async (
  credentialId: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(credentialId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts plain text using AES-GCM 256-bit with a key derived from the credential ID.
 *
 * @param {string} plainText - The text to encrypt.
 * @param {string} credentialId - The credential ID used for key derivation.
 * @returns {Promise<{ ciphertext: string; iv: string; salt: string }>} Encrypted data, IV, and salt in Base64.
 */
const encryptData = async (
  plainText: string,
  credentialId: string
): Promise<{ ciphertext: string; iv: string; salt: string }> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromCredentialId(credentialId, salt);
  const enc = new TextEncoder();
  const encoded = enc.encode(plainText);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
};

/**
 * Decrypts ciphertext using AES-GCM 256-bit with a key derived from the credential ID.
 *
 * @param {string} ciphertext - Base64 encoded encrypted text.
 * @param {string} iv - Base64 encoded initialization vector.
 * @param {string} salt - Base64 encoded salt.
 * @param {string} credentialId - The credential ID used for key derivation.
 * @returns {Promise<string>} The decrypted plain text.
 */
const decryptData = async (
  ciphertext: string,
  iv: string,
  salt: string,
  credentialId: string
): Promise<string> => {
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const key = await deriveKeyFromCredentialId(credentialId, saltBytes);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encryptedBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
};

/**
 * Checks if the current browser and device support biometric authentication (fingerprint / FaceID / TouchID / Windows Hello).
 *
 * @returns {Promise<boolean>} True if biometric authenticator is supported and available on device.
 */
export const isBiometricsAvailable = async (): Promise<boolean> => {
  try {
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ||
      !window.crypto?.subtle
    ) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.warn('Biometrics check error:', error);
    return false;
  }
};

/**
 * Checks whether the user has already configured biometrics on this device.
 *
 * @returns {boolean} True if biometric data is saved locally.
 */
export const hasRegisteredBiometrics = (): boolean => {
  try {
    const data = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
    if (!data) return false;
    const parsed: BiometricSessionData = JSON.parse(data);
    return Boolean(parsed && parsed.credentialId && parsed.username);
  } catch {
    return false;
  }
};

/**
 * Returns the saved biometric session metadata (like user name).
 *
 * @returns {BiometricSessionData | null} The saved session metadata or null if not found.
 */
export const getRegisteredBiometricData = (): BiometricSessionData | null => {
  try {
    const data = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Registers biometrics on the device using WebAuthn and stores encrypted credentials.
 *
 * @param {object} params - The parameters containing username, password, user object, and token.
 * @param {string} params.username - The user identifier.
 * @param {string} [params.password] - The password to securely store encrypted on the device.
 * @param {any} params.user - The user metadata object.
 * @param {string} [params.token] - The current auth token if available.
 * @returns {Promise<boolean>} True if registration was successful.
 */
export const registerBiometrics = async ({
  username,
  password,
  user,
  token,
}: {
  username: string;
  password?: string;
  user: any;
  token?: string;
}): Promise<boolean> => {
  try {
    if (!(await isBiometricsAvailable())) {
      return false;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const formattedDisplayName =
      formatPersonShortName(user?.firstName, user?.lastName) || username;

    const cleanUsername = (username || user?.username || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Iglekids',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: cleanUsername,
          displayName: formattedDisplayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    if (!credential) return false;

    // Convert rawId to base64 string
    const credentialId = btoa(
      String.fromCharCode(...new Uint8Array(credential.rawId))
    );

    let encryptedPassword: string | undefined;
    let iv: string | undefined;
    let salt: string | undefined;

    if (password) {
      const encResult = await encryptData(password, credentialId);
      encryptedPassword = encResult.ciphertext;
      iv = encResult.iv;
      salt = encResult.salt;
    }

    const sessionData: BiometricSessionData = {
      username: cleanUsername,
      user,
      token,
      encryptedPassword,
      iv,
      salt,
      credentialId,
      registeredAt: Date.now(),
    };

    localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(sessionData));
    return true;
  } catch (error: any) {
    console.warn('Biometric registration error/cancelled:', error);
    return false;
  }
};

/**
 * Updates the stored biometric session token, user data, and optionally re-encrypts the password.
 *
 * @param {object} params - The session payload.
 * @param {string} params.token - The new JWT token.
 * @param {any} [params.user] - Updated user info.
 * @param {string} [params.password] - Plain text password to encrypt and persist with the existing credential.
 * @returns {Promise<void>} Resolves when storage has been updated.
 */
export const updateBiometricSessionToken = async ({
  token,
  user,
  password,
}: {
  token: string;
  user?: any;
  password?: string;
}): Promise<void> => {
  try {
    const saved = getRegisteredBiometricData();
    if (!saved) return;

    let encryptedPassword = saved.encryptedPassword;
    let iv = saved.iv;
    let salt = saved.salt;

    if (password && saved.credentialId) {
      try {
        const encResult = await encryptData(password, saved.credentialId);
        encryptedPassword = encResult.ciphertext;
        iv = encResult.iv;
        salt = encResult.salt;
      } catch (encError) {
        console.warn('Could not re-encrypt password for biometric session:', encError);
      }
    }

    const resolvedUsername = (user?.username || saved.username || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    const updated: BiometricSessionData = {
      ...saved,
      token,
      username: resolvedUsername,
      user: user || saved.user,
      encryptedPassword,
      iv,
      salt,
    };
    localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Could not update biometric session token:', error);
  }
};

/**
 * Prompts the user with the native fingerprint / Face ID scanner and returns the validated session.
 * If the cached token is expired, returns decrypted credentials for backend re-authentication.
 *
 * @returns {Promise<BiometricAuthResult | null>} The authentication result or null.
 */
export const authenticateWithBiometrics = async (): Promise<BiometricAuthResult | null> => {
  try {
    const savedData = getRegisteredBiometricData();
    if (!savedData || !savedData.credentialId) {
      return null;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rawIdBytes = Uint8Array.from(atob(savedData.credentialId), (c) =>
      c.charCodeAt(0)
    );

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: rawIdBytes,
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!assertion) {
      return null;
    }

    // Check if current cached token is still valid
    const isTokenStillValid = Boolean(savedData.token && !isTokenExpired(savedData.token));

    if (isTokenStillValid) {
      return {
        username: savedData.username,
        user: savedData.user,
        token: savedData.token,
        tokenValid: true,
      };
    }

    // If token expired but encrypted password is present, decrypt it
    if (savedData.encryptedPassword && savedData.iv && savedData.salt) {
      const decryptedPassword = await decryptData(
        savedData.encryptedPassword,
        savedData.iv,
        savedData.salt,
        savedData.credentialId
      );

      return {
        username: savedData.username,
        user: savedData.user,
        password: decryptedPassword,
        tokenValid: false,
      };
    }

    // Legacy fallback without encrypted password: throw meaningful error without wiping credentials
    throw new Error('La sesión anterior expiró. Por favor, ingresa con tu contraseña una vez para actualizar la huella.');
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('Autenticación biométrica cancelada.');
    }
    throw error;
  }
};

/**
 * Removes the biometric session from local storage.
 *
 * @returns {void}
 */
export const clearBiometricSession = (): void => {
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
};
