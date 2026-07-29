import { STORAGE_KEYS } from '../common/constants';
import { User } from '../@types';

export const getStoredToken = (): string | null => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredSession = (token: string, user: User): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearStoredSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};
