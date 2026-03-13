import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Storage keys
const STORAGE_KEYS = {
  POSTS: 'offline_posts',
  MESSAGES: 'offline_messages',
  USER_PROFILE: 'offline_user_profile',
  FAVORITES: 'offline_favorites',
  PENDING_ACTIONS: 'pending_actions',
};

// Offline storage utilities
export const OfflineStorage = {
  // Save data to offline storage
  save: async (key, data) => {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      console.error('Offline save error:', error);
    }
  },

  // Get data from offline storage
  get: async (key) => {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error('Offline get error:', error);
      return null;
    }
  },

  // Remove data from offline storage
  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Offline remove error:', error);
    }
  },

  // Clear all offline data
  clear: async () => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Offline clear error:', error);
    }
  },
};

// Network status hook
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
};

// Pending actions manager
export const PendingActions = {
  // Add action to pending queue
  add: async (action) => {
    try {
      const pending = await OfflineStorage.get(STORAGE_KEYS.PENDING_ACTIONS) || [];
      const newAction = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action,
      };
      pending.push(newAction);
      await OfflineStorage.save(STORAGE_KEYS.PENDING_ACTIONS, pending);
    } catch (error) {
      console.error('Add pending action error:', error);
    }
  },

  // Get all pending actions
  getAll: async () => {
    try {
      return await OfflineStorage.get(STORAGE_KEYS.PENDING_ACTIONS) || [];
    } catch (error) {
      console.error('Get pending actions error:', error);
      return [];
    }
  },

  // Remove action from pending queue
  remove: async (actionId) => {
    try {
      const pending = await OfflineStorage.get(STORAGE_KEYS.PENDING_ACTIONS) || [];
      const filtered = pending.filter(action => action.id !== actionId);
      await OfflineStorage.save(STORAGE_KEYS.PENDING_ACTIONS, filtered);
    } catch (error) {
      console.error('Remove pending action error:', error);
    }
  },

  // Clear all pending actions
  clear: async () => {
    try {
      await OfflineStorage.save(STORAGE_KEYS.PENDING_ACTIONS, []);
    } catch (error) {
      console.error('Clear pending actions error:', error);
    }
  },
};

// Offline-aware data manager
export const OfflineDataManager = {
  // Save posts for offline access
  savePosts: async (posts) => {
    await OfflineStorage.save(STORAGE_KEYS.POSTS, {
      data: posts,
      timestamp: new Date().toISOString(),
    });
  },

  // Get cached posts
  getCachedPosts: async () => {
    const cached = await OfflineStorage.get(STORAGE_KEYS.POSTS);
    return cached?.data || [];
  },

  // Save messages for offline access
  saveMessages: async (chatId, messages) => {
    const allMessages = await OfflineStorage.get(STORAGE_KEYS.MESSAGES) || {};
    allMessages[chatId] = {
      data: messages,
      timestamp: new Date().toISOString(),
    };
    await OfflineStorage.save(STORAGE_KEYS.MESSAGES, allMessages);
  },

  // Get cached messages
  getCachedMessages: async (chatId) => {
    const allMessages = await OfflineStorage.get(STORAGE_KEYS.MESSAGES) || {};
    return allMessages[chatId]?.data || [];
  },

  // Get all cached messages (for statistics)
  getAllCachedMessages: async () => {
    const allMessages = await OfflineStorage.get(STORAGE_KEYS.MESSAGES) || {};
    let totalMessages = [];
    Object.values(allMessages).forEach(chat => {
      if (chat.data) {
        totalMessages = totalMessages.concat(chat.data);
      }
    });
    return totalMessages;
  },

  // Save user profile
  saveUserProfile: async (profile) => {
    await OfflineStorage.save(STORAGE_KEYS.USER_PROFILE, {
      data: profile,
      timestamp: new Date().toISOString(),
    });
  },

  // Get cached user profile
  getCachedUserProfile: async () => {
    const cached = await OfflineStorage.get(STORAGE_KEYS.USER_PROFILE);
    return cached?.data || null;
  },

  // Save favorites
  saveFavorites: async (favorites) => {
    await OfflineStorage.save(STORAGE_KEYS.FAVORITES, {
      data: Array.from(favorites),
      timestamp: new Date().toISOString(),
    });
  },

  // Get cached favorites
  getCachedFavorites: async () => {
    const cached = await OfflineStorage.get(STORAGE_KEYS.FAVORITES);
    return new Set(cached?.data || []);
  },
};

// Sync manager for when connection is restored
export const SyncManager = {
  // Sync all pending actions
  syncPendingActions: async () => {
    try {
      const pendingActions = await PendingActions.getAll();
      
      for (const action of pendingActions) {
        try {
          await executeAction(action);
          await PendingActions.remove(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          // Keep action in queue for retry
        }
      }
    } catch (error) {
      console.error('Sync pending actions error:', error);
    }
  },

  // Check if data is stale and needs refresh
  isDataStale: (timestamp, maxAgeMinutes = 30) => {
    if (!timestamp) return true;
    const now = new Date();
    const dataTime = new Date(timestamp);
    const ageMinutes = (now - dataTime) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  },
};

// Execute a pending action
const executeAction = async (action) => {
  switch (action.type) {
    case 'CREATE_POST':
      // Import and call createPost function
      const { createPost } = await import('./posts');
      return await createPost(action.data);
      
    case 'SEND_MESSAGE':
      // Import and call sendMessage function
      const { sendMessage } = await import('./messages');
      return await sendMessage(action.data.chatId, action.data.text);
      
    case 'TOGGLE_FAVORITE':
      // Import and call toggleFavorite function
      const { toggleFavorite } = await import('./posts');
      return await toggleFavorite(action.data.userId, action.data.postId, action.data.isFav);
      
    default:
      console.warn('Unknown action type:', action.type);
  }
};

// Hook for offline-aware operations
export const useOfflineAware = () => {
  const { isConnected } = useNetworkStatus();
  
  const executeOrQueue = async (actionType, data, onlineFunction) => {
    if (isConnected) {
      try {
        return await onlineFunction(data);
      } catch (error) {
        // If online operation fails, queue for later
        await PendingActions.add({ type: actionType, data });
        throw error;
      }
    } else {
      // Queue action for when connection is restored
      await PendingActions.add({ type: actionType, data });
      throw new Error('No internet connection. Action queued for later.');
    }
  };

  return { isConnected, executeOrQueue };
};