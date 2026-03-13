// src/services/crashlytics.js
import crashlytics from '@react-native-firebase/crashlytics';

// Initialize Crashlytics
export const initCrashlytics = async () => {
  try {
    // Enable Crashlytics collection
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    console.log('✅ Crashlytics initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Crashlytics:', error);
  }
};

// Log custom error
export const logError = (error, context = '') => {
  try {
    if (context) {
      crashlytics().log(`Context: ${context}`);
    }
    crashlytics().recordError(error);
    console.log('📊 Error logged to Crashlytics:', error.message);
  } catch (e) {
    console.error('Failed to log error to Crashlytics:', e);
  }
};

// Log custom message
export const logMessage = (message) => {
  try {
    crashlytics().log(message);
  } catch (error) {
    console.error('Failed to log message:', error);
  }
};

// Set user identifier
export const setUserId = (userId) => {
  try {
    crashlytics().setUserId(userId);
    console.log('👤 User ID set in Crashlytics:', userId);
  } catch (error) {
    console.error('Failed to set user ID:', error);
  }
};

// Set custom attributes
export const setAttribute = (key, value) => {
  try {
    crashlytics().setAttribute(key, value);
  } catch (error) {
    console.error('Failed to set attribute:', error);
  }
};

// Force a crash (for testing only)
export const testCrash = () => {
  crashlytics().crash();
};

// Log non-fatal error with custom attributes
export const logErrorWithAttributes = (error, attributes = {}) => {
  try {
    // Set custom attributes
    Object.keys(attributes).forEach(key => {
      crashlytics().setAttribute(key, String(attributes[key]));
    });
    
    // Record the error
    crashlytics().recordError(error);
    console.log('📊 Error with attributes logged to Crashlytics');
  } catch (e) {
    console.error('Failed to log error with attributes:', e);
  }
};

export default {
  initCrashlytics,
  logError,
  logMessage,
  setUserId,
  setAttribute,
  testCrash,
  logErrorWithAttributes,
};
