import CryptoJS from 'crypto-js';

// This should be set as an environment variable in production
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback key';

export const encryptText = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decryptText = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptSettings = (settings: {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
}) => {
  return {
    apiKey: encryptText(settings.apiKey),
    apiSecret: encryptText(settings.apiSecret),
    accessToken: encryptText(settings.accessToken),
    accessTokenSecret: encryptText(settings.accessTokenSecret),
    bearerToken: settings.bearerToken ? encryptText(settings.bearerToken) : '',
  };
};

export const decryptSettings = (encryptedSettings: {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
}) => {
  return {
    apiKey: decryptText(encryptedSettings.apiKey),
    apiSecret: decryptText(encryptedSettings.apiSecret),
    accessToken: decryptText(encryptedSettings.accessToken),
    accessTokenSecret: decryptText(encryptedSettings.accessTokenSecret),
    bearerToken: encryptedSettings.bearerToken ? decryptText(encryptedSettings.bearerToken) : '',
  };
}; 