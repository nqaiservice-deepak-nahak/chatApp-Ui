import { ChatMessage, EncryptedChatMessage } from '../@types';
import { getStoredAesKey } from './shared-functions';

export const ENCRYPTED_MESSAGE_PLACEHOLDER = '[Encrypted message]';

type WireChatMessage = Omit<EncryptedChatMessage, 'message'> & {
  message: unknown;
};

const encryptedMessagePattern = /^[0-9a-f]{32}:[0-9a-f]+$/i;

const hexToArrayBuffer = (value: string): ArrayBuffer | null => {
  if (!value || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes.buffer;
};

const readPlainText = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const text = (value as { text?: unknown }).text;
  return typeof text === 'string' ? text : null;
};

/**
 * Decrypts the `ivHex:ciphertextHex` values produced by the API's
 * AES-256-CBC helper. Legacy plaintext and already-decoded `{ text }`
 * payloads pass through unchanged.
 */
export const decryptMessageText = async (value: unknown): Promise<string> => {
  const plainText = readPlainText(value);
  if (plainText === null) return ENCRYPTED_MESSAGE_PLACEHOLDER;
  if (!encryptedMessagePattern.test(plainText)) return plainText;

  const aesKey = getStoredAesKey();
  const subtle = globalThis.crypto?.subtle;
  if (!aesKey || !subtle) return ENCRYPTED_MESSAGE_PLACEHOLDER;

  const [ivHex, ciphertextHex] = plainText.split(':');
  const key = hexToArrayBuffer(aesKey);
  const iv = hexToArrayBuffer(ivHex);
  const ciphertext = hexToArrayBuffer(ciphertextHex);

  if (!key || key.byteLength !== 32 || !iv || iv.byteLength !== 16 || !ciphertext) {
    return ENCRYPTED_MESSAGE_PLACEHOLDER;
  }

  try {
    const cryptoKey = await subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt']);
    const decrypted = await subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
    return readPlainText(parsed) ?? ENCRYPTED_MESSAGE_PLACEHOLDER;
  } catch {
    return ENCRYPTED_MESSAGE_PLACEHOLDER;
  }
};

export const normalizeChatMessage = async (message: WireChatMessage): Promise<ChatMessage> => ({
  ...message,
  message: await decryptMessageText(message.message)
});

export const normalizeChatMessages = async (
  messages: WireChatMessage[] = []
): Promise<ChatMessage[]> => Promise.all(messages.map(normalizeChatMessage));
