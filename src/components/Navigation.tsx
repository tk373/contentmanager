'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRSSFeed } from '@/hooks/useRSSFeed';

const RSS_FEED_URL = 'https://www.srf.ch/news/bnf/rss/19032223';

export default function Navigation() {
  const { user, logout } = useAuth();
  const { newItemsCount } = useRSSFeed(RSS_FEED_URL, {
    enableNotifications: false, // Only track count in nav, don't enable notifications
    checkInterval: 10 * 60 * 1000, // Check every 10 minutes
    autoMarkAsRead: false
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Content Manager
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Posts
            </Link>
            <Link 
              href="/add-post" 
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Add Post
            </Link>
            <Link 
              href="/news" 
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium relative"
            >
              News
              {newItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {newItemsCount > 9 ? '9+' : newItemsCount}
                </span>
              )}
            </Link>
            <Link 
              href="/settings" 
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 