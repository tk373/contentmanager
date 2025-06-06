'use client';

import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { encryptSettings, decryptSettings } from '@/lib/encryption';

export interface UserSettings {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));
      
      if (settingsDoc.exists()) {
        const encryptedData = settingsDoc.data();
        try {
          const decryptedSettings = decryptSettings(encryptedData as any);
          setSettings(decryptedSettings);
        } catch (error) {
          console.error('Error decrypting settings:', error);
          setSettings(null);
        }
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    if (!user) return;

    try {
      const encryptedSettings = encryptSettings(newSettings);
      await setDoc(doc(db, 'userSettings', user.uid), {
        ...encryptedSettings,
        updatedAt: new Date(),
      });
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  return { settings, loading, saveSettings, refetch: fetchSettings };
}; 