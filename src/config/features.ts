/**
 * Application feature flags configured via Vite environment variables.
 * Enables zero-downtime toggling of features without code deployments.
 */
export const FEATURES = {
  volunteerAttendance: import.meta.env.VITE_FEATURE_VOLUNTEER_ATTENDANCE === 'true',
} as const;

export type FeatureFlagKey = keyof typeof FEATURES;

/**
 * Checks if a specific application feature is currently enabled.
 *
 * @param {FeatureFlagKey} feature - Name of the feature flag to evaluate.
 * @returns {boolean} True if the feature is enabled.
 */
export const isFeatureEnabled = (feature: FeatureFlagKey): boolean => {
  return Boolean(FEATURES[feature]);
};
