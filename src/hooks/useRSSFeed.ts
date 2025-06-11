'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchRSSFeed, 
  RSSFeed, 
  markItemsAsSeen, 
  updateLastCheckTime,
  requestNotificationPermission,
  showNotification 
} from '@/utils/rssUtils';

interface UseRSSFeedOptions {
  enableNotifications?: boolean;
  checkInterval?: number; // in milliseconds
  autoMarkAsRead?: boolean;
}

export const useRSSFeed = (url: string, options: UseRSSFeedOptions = {}) => {
  const {
    enableNotifications = false,
    checkInterval = 5 * 60 * 1000, // 5 minutes default
    autoMarkAsRead = false
  } = options;

  const [feed, setFeed] = useState<RSSFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);

  const fetchFeed = useCallback(async (showNotifications = false) => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      const feedData = await fetchRSSFeed(url);
      
      // Count new items
      const newItems = feedData.items.filter(item => item.isNew);
      const newCount = newItems.length;
      
      // Show notifications for new items (but not on first load)
      if (showNotifications && !isFirstLoad.current && newCount > 0 && notificationsEnabled) {
        if (newCount === 1) {
          showNotification(`New article: ${newItems[0].title}`, {
            body: newItems[0].description.substring(0, 100) + '...',
            tag: 'rss-new-item'
          });
        } else {
          showNotification(`${newCount} new articles available`, {
            body: 'Check the news page for latest updates',
            tag: 'rss-new-items'
          });
        }
      }
      
      setFeed(feedData);
      setNewItemsCount(newCount);
      updateLastCheckTime();
      
      // Auto-mark as read if enabled and not first load
      if (autoMarkAsRead && !isFirstLoad.current) {
        const allGuids = feedData.items.map(item => item.guid);
        markItemsAsSeen(allGuids);
        setNewItemsCount(0);
      }
      
      isFirstLoad.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RSS feed');
      setFeed(null);
    } finally {
      setLoading(false);
    }
  }, [url, notificationsEnabled, autoMarkAsRead]);

  const enableNotificationsHandler = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  }, []);

  const markAsRead = useCallback((itemGuids?: string[]) => {
    if (!feed) return;
    
    const guidsToMark = itemGuids || feed.items.filter(item => item.isNew).map(item => item.guid);
    markItemsAsSeen(guidsToMark);
    
    // Update the feed state to reflect read status
    const updatedFeed = {
      ...feed,
      items: feed.items.map(item => ({
        ...item,
        isNew: itemGuids ? !itemGuids.includes(item.guid) && item.isNew : false
      }))
    };
    
    setFeed(updatedFeed);
    setNewItemsCount(updatedFeed.items.filter(item => item.isNew).length);
  }, [feed]);

  const refetch = useCallback(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Set up periodic checking
  useEffect(() => {
    if (enableNotifications && checkInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchFeed(true);
      }, checkInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enableNotifications, checkInterval, fetchFeed]);

  // Initial fetch
  useEffect(() => {
    fetchFeed(false);
  }, [fetchFeed]);

  // Check notification permission on mount
  useEffect(() => {
    if (enableNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [enableNotifications]);

  return { 
    feed, 
    loading, 
    error, 
    refetch, 
    newItemsCount,
    notificationsEnabled,
    enableNotificationsHandler,
    markAsRead
  };
}; 