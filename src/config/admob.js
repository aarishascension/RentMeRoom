// AdMob Configuration for RentMeRoom App - Updated with Google's Official Demo Ad Units
import { Platform } from 'react-native';

// Google's Official Demo Ad Unit IDs (for testing)
export const GOOGLE_DEMO_AD_UNITS = {
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
  FIXED_SIZE_BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
  NATIVE: 'ca-app-pub-3940256099942544/2247696110',
  NATIVE_VIDEO: 'ca-app-pub-3940256099942544/1044960115',
};

// Real AdMob IDs - Updated for react-native-google-mobile-ads
export const ADMOB_CONFIG = {
  // App ID (your real AdMob App ID)
  APP_ID: Platform.select({
    ios: 'ca-app-pub-4344140632373860~2632082864', // Your real App ID
    android: 'ca-app-pub-4344140632373860~2632082864', // Your real App ID
  }),
  
  // Ad Unit IDs (your real Ad Unit IDs)
  AD_UNITS: {
    // Banner ads for bottom of screens (your real banner ID)
    BANNER: Platform.select({
      ios: 'ca-app-pub-4344140632373860/3026016293', // Your real Banner ID
      android: 'ca-app-pub-4344140632373860/3026016293', // Your real Banner ID
    }),
    
    // Interstitial ads between screens (your real interstitial ID)
    INTERSTITIAL: Platform.select({
      ios: 'ca-app-pub-4344140632373860/4919334852', // Your real Interstitial ID
      android: 'ca-app-pub-4344140632373860/4919334852', // Your real Interstitial ID
    }),
    
    // Native ads that blend with content (your real native ID)
    NATIVE: Platform.select({
      ios: 'ca-app-pub-4344140632373860/1210371742', // Your real Native ID
      android: 'ca-app-pub-4344140632373860/1210371742', // Your real Native ID
    }),
    
    // Rewarded ads for premium features (optional - create in AdMob dashboard)
    REWARDED: Platform.select({
      ios: 'ca-app-pub-3940256099942544/1712485313', // Test ID - create real rewarded unit
      android: 'ca-app-pub-3940256099942544/5224354917', // Test ID - create real rewarded unit
    }),
  },
  
  // Ad settings
  SETTINGS: {
    // Show ads after every N post views
    INTERSTITIAL_FREQUENCY: 3,
    
    // Show banner ads on these screens
    BANNER_SCREENS: ['Home', 'Search', 'PostDetail'],
    
    // Force demo ads for local development (set to false for production)
    FORCE_DEMO_ADS: false, // Set to false to use production ads
    
    // Production mode - set to false for production
    TEST_MODE: false, // Changed to false for production
  }
};

// Helper functions to get correct ad unit IDs
export const getAdUnitId = (adType) => {
  // Always use demo ads in development OR if FORCE_DEMO_ADS is true
  if (__DEV__ || ADMOB_CONFIG.SETTINGS.FORCE_DEMO_ADS) {
    // Use Google's official demo ad units for local development
    switch (adType) {
      case 'banner':
        return GOOGLE_DEMO_AD_UNITS.ADAPTIVE_BANNER;
      case 'interstitial':
        return GOOGLE_DEMO_AD_UNITS.INTERSTITIAL;
      case 'native':
        return GOOGLE_DEMO_AD_UNITS.NATIVE;
      case 'rewarded':
        return GOOGLE_DEMO_AD_UNITS.REWARDED;
      default:
        return GOOGLE_DEMO_AD_UNITS.ADAPTIVE_BANNER;
    }
  } else {
    // Use real ad units in production
    switch (adType) {
      case 'banner':
        return ADMOB_CONFIG.AD_UNITS.BANNER;
      case 'interstitial':
        return ADMOB_CONFIG.AD_UNITS.INTERSTITIAL;
      case 'native':
        return ADMOB_CONFIG.AD_UNITS.NATIVE;
      case 'rewarded':
        return ADMOB_CONFIG.AD_UNITS.REWARDED;
      default:
        return ADMOB_CONFIG.AD_UNITS.BANNER;
    }
  }
};

// Next steps for complete setup:
/*
1. ✅ Banner Ad Unit Created: ca-app-pub-4344140632373860/3026016293
2. ✅ Interstitial Ad Unit Created: ca-app-pub-4344140632373860/4919334852
3. ✅ Native Ad Unit Created: ca-app-pub-4344140632373860/1210371742
4. ✅ Google Demo Ad Units Added for Testing
5. ✅ App.json updated with real App ID
6. ✅ Development build created and ready for testing
7. 🔄 Test ads in development build (using Google demo units)
8. 🔄 Publish to Play Store with privacy policy

Note: Updated to use Google's official demo ad unit IDs for testing
*/