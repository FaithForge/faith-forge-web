/**
 * Application feature flags configured via Vite environment variables.
 * Enables zero-downtime toggling of features without code deployments.
 */
export const FEATURES = {
  guardianSignup: import.meta.env.VITE_FEATURE_GUARDIAN_SIGNUP === 'true',
  churchReports: import.meta.env.VITE_FEATURE_CHURCH_REPORTS === 'true',
  kidRegister: import.meta.env.VITE_FEATURE_KID_REGISTER === 'true',
  FEATURE_KID_REGISTER: import.meta.env.VITE_FEATURE_KID_REGISTER === 'true',
} as const;

export type FeatureFlagKey = keyof typeof FEATURES;

/**
 * Global constant alias for the kid document identity registration feature flag.
 */
export const FEATURE_KID_REGISTER = import.meta.env.VITE_FEATURE_KID_REGISTER === 'true';

/**
 * Checks if a specific application feature is currently enabled.
 *
 * @param {FeatureFlagKey} feature - Name of the feature flag to evaluate.
 * @returns {boolean} True if the feature is enabled.
 */
export const isFeatureEnabled = (feature: FeatureFlagKey): boolean => {
  return Boolean(FEATURES[feature]);
};
