import { UserSettings } from '@/hooks/useSettings';

export const areSettingsConfigured = (settings: UserSettings | null): boolean => {
  if (!settings) return false;
  
  return !!(
    settings.apiKey && 
    settings.apiSecret && 
    settings.accessToken && 
    settings.accessTokenSecret
  );
};

export const getIncompleteSettingsFields = (settings: UserSettings | null): string[] => {
  if (!settings) return ['API Key', 'API Secret', 'Access Token', 'Access Token Secret'];
  
  const missing: string[] = [];
  
  if (!settings.apiKey) missing.push('API Key');
  if (!settings.apiSecret) missing.push('API Secret');
  if (!settings.accessToken) missing.push('Access Token');
  if (!settings.accessTokenSecret) missing.push('Access Token Secret');
  
  return missing;
}; 