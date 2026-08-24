import { isTokenExpired } from './jwt';

const BIOMETRIC_STORAGE_KEY = 'iglekids_biometric_session';

export interface BiometricSessionData {
  username: string;
  user: any;
  token: string;
  credentialId: string;
  registeredAt: number;
}

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
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
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
    return Boolean(parsed && parsed.token && !isTokenExpired(parsed.token));
  } catch {
    return false;
  }
};

/**
 * Returns the saved biometric session metadata (like user name).
 *
 * @returns {BiometricSessionData | null}
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
 * Registers biometrics on the device using WebAuthn.
 * Triggers the native fingerprint / Face ID prompt.
 *
 * @param {object} params - The user session data to secure.
 * @returns {Promise<boolean>} True if registration was successful.
 */
export const registerBiometrics = async ({
  username,
  user,
  token,
}: {
  username: string;
  user: any;
  token: string;
}): Promise<boolean> => {
  try {
    if (!(await isBiometricsAvailable())) {
      return false;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Iglekids',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: user?.firstName || username,
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

    const sessionData: BiometricSessionData = {
      username,
      user,
      token,
      credentialId,
      registeredAt: Date.now(),
    };

    localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(sessionData));
    return true;
  } catch (error: any) {
    // User cancelled prompt or platform error
    console.warn('Biometric registration error/cancelled:', error);
    return false;
  }
};

/**
 * Prompts the user with the native fingerprint / Face ID scanner and returns the validated session.
 *
 * @returns {Promise<BiometricSessionData | null>} The session data if verification succeeded, null otherwise.
 */
export const authenticateWithBiometrics = async (): Promise<BiometricSessionData | null> => {
  try {
    const savedData = getRegisteredBiometricData();
    if (!savedData || !savedData.credentialId) {
      return null;
    }

    // Verify token validity
    if (isTokenExpired(savedData.token)) {
      clearBiometricSession();
      throw new Error('La sesión guardada ha expirado. Ingresa con tu contraseña.');
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
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (assertion) {
      return savedData;
    }

    return null;
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('Autenticación biométrica cancelada.');
    }
    throw error;
  }
};

/**
 * Removes the biometric session from local storage.
 */
export const clearBiometricSession = (): void => {
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
};
