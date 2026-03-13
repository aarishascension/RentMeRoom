import { useEffect, useState } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';

const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.AD_UNITS.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: false,
});

export function useInterstitialAd() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsLoaded(false);
      // Preload next ad
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      setIsLoaded(false);
    });

    // Start loading the first ad
    interstitial.load();

    // Cleanup function
    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const showAd = async () => {
    if (isLoaded) {
      try {
        await interstitial.show();
      } catch (error) {
        console.log('Error showing interstitial ad:', error);
      }
    }
  };

  // Show ad based on frequency
  const maybeShowAd = () => {
    const newCount = viewCount + 1;
    setViewCount(newCount);
    
    if (newCount % ADMOB_CONFIG.SETTINGS.INTERSTITIAL_FREQUENCY === 0) {
      showAd();
    }
  };

  const loadAd = () => {
    if (!isLoaded) {
      interstitial.load();
    }
  };

  return {
    isLoaded,
    showAd,
    maybeShowAd,
    loadAd,
  };
}