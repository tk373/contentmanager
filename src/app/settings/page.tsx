'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessTokenSecret, setAccessTokenSecret] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, loading: authLoading } = useAuth();
  const { settings, saveSettings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      setApiSecret(settings.apiSecret || '');
      setAccessToken(settings.accessToken || '');
      setAccessTokenSecret(settings.accessTokenSecret || '');
      setBearerToken(settings.bearerToken || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await saveSettings({
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
        bearerToken,
      });
      setSuccess('Settings saved successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      setError('Please save your settings first before testing connection.');
      setLoading(false);
      return;
    }

    try {
      const testConnection = httpsCallable(functions, 'testXConnection');
      const result = await testConnection();
      
      setSuccess(`✅ Connection successful! Connected as @${(result.data as any).username}`);
    } catch (error: any) {
      setError(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <Navigation />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">X (Twitter) API Credentials</h2>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">How to get your X API credentials:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Go to <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="underline">developer.twitter.com</a></li>
              <li>2. Create a new app or use an existing one</li>
              <li>3. Go to your app's "Keys and tokens" section</li>
              <li>4. Generate/copy the required credentials</li>
            </ol>
          </div>

          {settingsLoading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
              )}
              
              {success && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">{success}</div>
              )}

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  id="apiKey"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your X API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret Key *
                </label>
                <input
                  type="password"
                  id="apiSecret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your X API Secret Key"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token *
                </label>
                <input
                  type="password"
                  id="accessToken"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your X Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="accessTokenSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token Secret *
                </label>
                <input
                  type="password"
                  id="accessTokenSecret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your X Access Token Secret"
                  value={accessTokenSecret}
                  onChange={(e) => setAccessTokenSecret(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="bearerToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Bearer Token (Optional)
                </label>
                <input
                  type="password"
                  id="bearerToken"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your X Bearer Token (for API v2)"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
                
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Test Connection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 