const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): boolean => emailRegex.test(email.trim());

export const validatePassword = (password: string): boolean => password.length >= 8;

/**
 * Validates display name for profile
 * @param name Display name to validate
 * @returns true if valid (2-50 chars, letters/spaces/hyphens/apostrophes only)
 */
export const validateDisplayName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 50) {
    return false;
  }
  // Only allow letters, spaces, hyphens, and apostrophes (with Unicode support)
  const nameRegex = /^[\p{L}\s\-']+$/u;
  return nameRegex.test(name);
};

/**
 * Validates height in centimeters
 * @param height Height in cm
 * @returns true if valid (50-300 cm range)
 */
export const validateHeight = (height: number): boolean => {
  return height >= 50 && height <= 300;
};

/**
 * Validates weight in kilograms
 * @param weight Weight in kg
 * @returns true if valid (20-500 kg range)
 */
export const validateWeight = (weight: number): boolean => {
  return weight >= 20 && weight <= 500;
};
