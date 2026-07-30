import { STORAGE_KEYS } from '../common/constants';
import { User } from '../@types';

const clearLegacyLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
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

export const setStoredSession = (token: string, user: User): void => {
  clearLegacyLocalStorage();
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearStoredSession = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  clearLegacyLocalStorage();
};
