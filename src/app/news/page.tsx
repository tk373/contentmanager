'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRSSFeed } from '@/hooks/useRSSFeed';
import { formatDate } from '@/utils/rssUtils';
import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';

const RSS_FEED_URL = 'https://www.srf.ch/news/bnf/rss/19032223';

export default function NewsPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    feed, 
    loading, 
    error, 
    refetch, 
    newItemsCount,
    notificationsEnabled,
    enableNotificationsHandler,
    markAsRead
  } = useRSSFeed(RSS_FEED_URL, {
    enableNotifications: true,
    checkInterval: 5 * 60 * 1000, // Check every 5 minutes
    autoMarkAsRead: false
  });

  const handleEnableNotifications = async () => {
    const granted = await enableNotificationsHandler();
    if (!granted) {
      alert('Notifications were denied. Please enable them in your browser settings to receive updates about new articles.');
    }
  };

  const handleMarkAllAsRead = () => {
    markAsRead();
  };

  const handleMarkItemAsRead = (itemGuid: string) => {
    markAsRead([itemGuid]);
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
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {feed?.title || 'SRF News'}
              </h1>
              {newItemsCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                  {newItemsCount} new
                </span>
              )}
            </div>
            {feed?.description && (
              <p className="text-gray-600">{feed.description}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={refetch}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              {newItemsCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {notificationsEnabled ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                  Notifications enabled
                </div>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  className="flex items-center text-gray-600 hover:text-indigo-600"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11.613 15.931L9.38 13.699a2.25 2.25 0 01-.659-1.591V9.75a6.001 6.001 0 0110.558 0v2.358a2.25 2.25 0 01-.659 1.591l-2.233 2.232M4 9v1.5a2.25 2.25 0 002.25 2.25H8"/>
                  </svg>
                  Enable notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && !feed ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading news feed...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading news feed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : feed && feed.items.length > 0 ? (
          <div className="grid gap-6">
            {feed.items.map((item, index) => (
              <article 
                key={item.guid || index} 
                className={`bg-white rounded-lg shadow-md border overflow-hidden ${
                  item.isNew ? 'ring-2 ring-blue-200 border-blue-300' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {item.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt=""
                          className="w-32 h-24 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 leading-tight flex items-center gap-2">
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-indigo-600 transition-colors"
                          >
                            {item.title}
                          </a>
                          {item.isNew && (
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              NEW
                            </span>
                          )}
                        </h2>
                        
                        {item.isNew && (
                          <button
                            onClick={() => handleMarkItemAsRead(item.guid)}
                            className="text-xs text-gray-500 hover:text-gray-700 ml-2 whitespace-nowrap"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {item.description.length > 200 
                            ? `${item.description.substring(0, 200)}...` 
                            : item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <time className="text-sm text-gray-500">
                          {formatDate(item.pubDate)}
                        </time>
                        
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Read more
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No news items found in the feed.</p>
          </div>
        )}
      </div>
    </>
  );
} 