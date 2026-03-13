// Expo Go compatibility utilities
import { Alert } from 'react-native';

// Check if running in Expo Go
export const isExpoGo = () => {
  return __DEV__ && typeof expo !== 'undefined';
};

// Safe notification request for Expo Go
export const safeRequestNotifications = async () => {
  if (isExpoGo()) {
    console.warn('Notifications limited in Expo Go - use development build for full features');
    return null;
  }
  
  try {
    const { requestNotificationPermissions } = await import('../services/notifications');
    return await requestNotificationPermissions();
  } catch (error) {
    console.warn('Notification permissions not available:', error);
    return null;
  }
};

// Safe notification listener for Expo Go
export const safeAddNotificationListener = (callback) => {
  if (isExpoGo()) {
    console.warn('Notification listeners limited in Expo Go');
    return { remove: () => {} };
  }
  
  try {
    const { addNotificationResponseListener } = require('../services/notifications');
    return addNotificationResponseListener(callback);
  } catch (error) {
    console.warn('Notification listener not available:', error);
    return { remove: () => {} };
  }
};

// Show Expo Go limitation alert
export const showExpoGoLimitation = (featureName) => {
  Alert.alert(
    'Feature Limited in Expo Go',
    `${featureName} has limited functionality in Expo Go. For full features, use a development build.\n\nYou can still test the UI and basic functionality!`,
    [{ text: 'OK' }]
  );
};