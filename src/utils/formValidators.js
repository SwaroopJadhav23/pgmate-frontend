export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;

export const digitsOnly = (value = "") => value.replace(/\D/g, "");
export const isValidEmail = (value = "") => EMAIL_REGEX.test(value.trim());
export const isValidPhone = (value = "") => PHONE_REGEX.test(value.trim());
