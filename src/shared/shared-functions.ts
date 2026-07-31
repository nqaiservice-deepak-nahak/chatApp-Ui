import { STORAGE_KEYS } from '../common/constants';
import { User } from '../@types';

const UTC_API_TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const clearLegacyLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AES_KEY);
};

export const getStoredToken = (): string | null => {
  clearLegacyLocalStorage();
  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getStoredUser = (): User | null => {
  clearLegacyLocalStorage();
  const raw = sessionStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    return null;
  }
};

export const getStoredAesKey = (): string | null => {
  clearLegacyLocalStorage();
  return sessionStorage.getItem(STORAGE_KEYS.AES_KEY);
};

export const setStoredSession = (token: string, user: User, aesKey: string): void => {
  clearLegacyLocalStorage();
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  sessionStorage.setItem(STORAGE_KEYS.AES_KEY, aesKey);
};

export const clearStoredSession = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.AES_KEY);
  clearLegacyLocalStorage();
};

/**
 * The API emits UTC timestamps as `YYYY-MM-DD HH:mm:ss` without a timezone
 * suffix. Add the missing UTC marker before handing them to the browser.
 */
export const parseApiDate = (value: string): Date => {
  const normalized = UTC_API_TIMESTAMP.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value;

  return new Date(normalized);
};
