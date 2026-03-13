// Error handling utilities for Firebase and app errors
import { logError } from '../services/crashlytics';

export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  // Log to Crashlytics
  logError(error, 'Firebase Error');
  
  // Common Firebase auth errors
  switch (error.code) {
    case 'auth/argument-error':
      console.warn('Firebase auth argument error - likely due to invalid parameters');
      return 'Authentication error - please try again';
    
    case 'auth/network-request-failed':
      return 'Network error - please check your connection';
    
    case 'auth/too-many-requests':
      return 'Too many requests - please wait and try again';
    
    case 'auth/user-not-found':
      return 'User not found - please check your credentials';
    
    case 'auth/wrong-password':
      return 'Incorrect password - please try again';
    
    case 'auth/email-already-in-use':
      return 'Email already in use - please use a different email';
    
    case 'auth/weak-password':
      return 'Password is too weak - please use a stronger password';
    
    case 'auth/invalid-email':
      return 'Invalid email address - please check your email';
    
    default:
      return error.message || 'An unexpected error occurred';
  }
};

export const handleAsyncError = async (asyncFunction, fallbackValue = null) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Async operation failed:', error);
    logError(error, 'Async operation failed');
    return fallbackValue;
  }
};

export const safeFirebaseCall = async (firebaseFunction, errorMessage = 'Operation failed') => {
  try {
    return await firebaseFunction();
  } catch (error) {
    const friendlyMessage = handleFirebaseError(error);
    console.error(errorMessage, friendlyMessage);
    throw new Error(friendlyMessage);
  }
};