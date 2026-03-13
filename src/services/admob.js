import mobileAds from 'react-native-google-mobile-ads';

let isInitialized = false;

export const initializeAdMob = async () => {
  if (isInitialized) {
    return;
  }

  try {
    await mobileAds().initialize();
    isInitialized = true;
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('AdMob initialization failed:', error);
  }
};

export const getAdMobStatus = () => {
  return isInitialized;
};