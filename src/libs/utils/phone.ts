/**
 * Configuration and validation rules for phone numbers by country dialing code.
 */
export interface PhoneCountryConfig {
  country: string;
  dialCode: string;
  expectedDigits: number;
  mask: string;
  placeholder: string;
  example: string;
  normalize?: (digits: string) => string;
}

export const PHONE_COUNTRY_CONFIG: Record<string, PhoneCountryConfig> = {
  '+57': {
    country: 'Colombia',
    dialCode: '+57',
    expectedDigits: 10,
    mask: '### ### ####',
    placeholder: '300 123 4567',
    example: '3101234567',
  },
  '+1': {
    country: 'Estados Unidos',
    dialCode: '+1',
    expectedDigits: 10,
    mask: '(###) ###-####',
    placeholder: '(202) 555-0123',
    example: '2025550123',
  },
  '+58': {
    country: 'Venezuela',
    dialCode: '+58',
    expectedDigits: 10,
    mask: '### ### ####',
    placeholder: '414 123 4567',
    example: '4141234567',
    normalize: (digits: string) => {
      // Normaliza números venezolanos ingresados como 04XX a 4XX
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.substring(1);
      }
      return digits;
    },
  },
  '+34': {
    country: 'España',
    dialCode: '+34',
    expectedDigits: 9,
    mask: '### ### ###',
    placeholder: '612 345 678',
    example: '612345678',
  },
  '+44': {
    country: 'Reino Unido',
    dialCode: '+44',
    expectedDigits: 10,
    mask: '#### ######',
    placeholder: '7123 456789',
    example: '7123456789',
    normalize: (digits: string) => {
      // Normaliza números británicos ingresados como 07XX a 7XX
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.substring(1);
      }
      return digits;
    },
  },
};

/**
 * Normalizes dial code string to ensure it starts with '+'.
 *
 * @param {string} [dialCode] - Raw dial code (e.g. "57", "+57").
 * @returns {string} Standardized dial code (e.g. "+57").
 */
export const normalizeDialCode = (dialCode?: string): string => {
  if (!dialCode || !dialCode.trim()) return '+57';
  const code = dialCode.trim();
  return code.startsWith('+') ? code : `+${code}`;
};

/**
 * Returns country configuration for a given dial code if available.
 *
 * @param {string} [dialCode] - The country dial code.
 * @returns {PhoneCountryConfig | undefined} The country config or undefined if unlisted.
 */
export const getPhoneCountryConfig = (dialCode?: string): PhoneCountryConfig | undefined => {
  const code = normalizeDialCode(dialCode);
  return PHONE_COUNTRY_CONFIG[code];
};

/**
 * Returns the maximum allowed digits for a given dial code.
 *
 * @param {string} [dialCode] - The country dial code.
 * @returns {number} Maximum digits (e.g. 10 for +57, 9 for +34, 15 for fallback).
 */
export const getMaxPhoneDigits = (dialCode?: string): number => {
  const config = getPhoneCountryConfig(dialCode);
  return config ? config.expectedDigits : 15;
};

/**
 * Extracts digits from a raw phone string and applies country normalization.
 *
 * @param {string} [raw] - Raw phone input.
 * @param {string} [dialCode] - Dial code for normalization rules.
 * @returns {string} Clean numeric digits.
 */
export const cleanPhoneDigits = (raw?: string, dialCode?: string): string => {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  const config = getPhoneCountryConfig(dialCode);
  if (config?.normalize) {
    digits = config.normalize(digits);
  }
  return digits;
};

/**
 * Applies a mask pattern (e.g. `### ### ####` or `(###) ###-####`) to a string of digits.
 *
 * @param {string} [raw] - Raw input or digits.
 * @param {string} [dialCode] - Dial code to look up mask.
 * @returns {string} Formatted masked string.
 */
export const maskPhoneNumber = (raw?: string, dialCode?: string, truncateToMax = false): string => {
  if (!raw) return '';
  const config = getPhoneCountryConfig(dialCode);
  const maxDigits = config ? config.expectedDigits : 15;
  const clean = cleanPhoneDigits(raw, dialCode);
  const digits = truncateToMax ? clean.slice(0, maxDigits) : clean;

  if (!digits) return '';

  if (!config) {
    // Fallback: agrupa de a 3 o 4 dígitos para legibilidad
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }

  const { mask } = config;
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    const maskChar = mask[i];
    if (maskChar === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += maskChar;
    }
  }

  // Si hay dígitos adicionales más allá de la máscara, los añadimos con un espacio para visibilizar el error
  if (digitIndex < digits.length) {
    formatted += ' ' + digits.substring(digitIndex);
  }

  return formatted;
};

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  countryName?: string;
  expectedDigits?: number;
  actualDigits: number;
}

/**
 * Validates a phone number against its country dial code requirements.
 *
 * @param {string} [phone] - The phone value to validate.
 * @param {string} [dialCode] - The country dial code.
 * @returns {PhoneValidationResult} The validation result object.
 */
export const validatePhoneNumber = (phone?: string, dialCode?: string): PhoneValidationResult => {
  const code = normalizeDialCode(dialCode);
  const config = PHONE_COUNTRY_CONFIG[code];
  const digits = cleanPhoneDigits(phone, code);

  if (!digits) {
    return {
      isValid: false,
      error: 'El número de teléfono es requerido',
      countryName: config?.country,
      expectedDigits: config?.expectedDigits,
      actualDigits: 0,
    };
  }

  if (config) {
    if (digits.length !== config.expectedDigits) {
      return {
        isValid: false,
        error: `El teléfono para ${config.country} (${config.dialCode}) debe tener exactamente ${config.expectedDigits} dígitos (actualmente tiene ${digits.length}).`,
        countryName: config.country,
        expectedDigits: config.expectedDigits,
        actualDigits: digits.length,
      };
    }
    return {
      isValid: true,
      countryName: config.country,
      expectedDigits: config.expectedDigits,
      actualDigits: digits.length,
    };
  }

  // Fallback para otros países (E.164: entre 7 y 15 dígitos)
  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      error: `El número de teléfono debe tener entre 7 y 15 dígitos (actualmente tiene ${digits.length}).`,
      actualDigits: digits.length,
    };
  }

  return {
    isValid: true,
    actualDigits: digits.length,
  };
};

/**
 * Quick boolean check if a phone number is valid for a given dial code.
 *
 * @param {string} [phone] - The phone string.
 * @param {string} [dialCode] - The country dial code.
 * @returns {boolean} True if valid.
 */
export const isPhoneValid = (phone?: string, dialCode?: string): boolean => {
  return validatePhoneNumber(phone, dialCode).isValid;
};

/**
 * Formats a phone number for UI display with dial code and readable spacing/mask.
 *
 * @param {string} [phone] - Raw or clean phone number.
 * @param {string} [dialCode] - Dial code (default: "+57").
 * @returns {string} Readable formatted phone (e.g. "+57 310 123 4567").
 */
export const formatPhoneDisplay = (phone?: string, dialCode?: string): string => {
  if (!phone || !phone.trim()) return '';
  const code = normalizeDialCode(dialCode);
  const clean = cleanPhoneDigits(phone, code);
  const masked = maskPhoneNumber(clean, code);
  return `${code} ${masked}`.trim();
};
