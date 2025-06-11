export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  imageUrl?: string;
  isNew?: boolean;
}

export interface RSSFeed {
  title: string;
  description: string;
  items: RSSItem[];
}

// Local storage keys for tracking seen items
const SEEN_ITEMS_KEY = 'rss_seen_items';
const LAST_CHECK_KEY = 'rss_last_check';

export const getSeenItems = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  
  const seen = localStorage.getItem(SEEN_ITEMS_KEY);
  return seen ? new Set(JSON.parse(seen)) : new Set();
};

export const markItemsAsSeen = (itemGuids: string[]) => {
  if (typeof window === 'undefined') return;
  
  const seenItems = getSeenItems();
  itemGuids.forEach(guid => seenItems.add(guid));
  localStorage.setItem(SEEN_ITEMS_KEY, JSON.stringify([...seenItems]));
};

export const getLastCheckTime = (): Date | null => {
  if (typeof window === 'undefined') return null;
  
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  return lastCheck ? new Date(lastCheck) : null;
};

export const updateLastCheckTime = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

export const fetchRSSFeed = async (url: string): Promise<RSSFeed> => {
  try {
    // Use a CORS proxy to fetch the RSS feed
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const xmlText = data.contents;
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse XML');
    }
    
    // Extract feed information
    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
      throw new Error('Invalid RSS feed structure');
    }
    
    const feedTitle = channel.querySelector('title')?.textContent || 'RSS Feed';
    const feedDescription = channel.querySelector('description')?.textContent || '';
    
    // Get previously seen items
    const seenItems = getSeenItems();
    
    // Extract items
    const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const guid = item.querySelector('guid')?.textContent || link;
      
      // Try to extract image from description or enclosure
      let imageUrl = '';
      const descriptionText = description;
      const imgMatch = descriptionText.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
      
      // Clean description of HTML tags for preview
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
      
      // Check if item is new
      const isNew = !seenItems.has(guid);
      
      return {
        title,
        description: cleanDescription,
        link,
        pubDate,
        guid,
        imageUrl,
        isNew
      };
    });
    
    return {
      title: feedTitle,
      description: feedDescription,
      items
    };
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}; 