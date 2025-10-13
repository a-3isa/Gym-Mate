const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const validateEmail = (email: string): boolean => emailRegex.test(email.trim());

export const validatePassword = (password: string): boolean => password.length >= 8;

// TODO: Add validateWeight, validateHeight, and validateReps helpers when forms are implemented
