import { useEffect, useState } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../config/admob';

const adUnitId = getAdUnitId('interstitial');

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: false,
});

export default function useSimpleInterstitialAd() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [adShowCount, setAdShowCount] = useState(0); // Track how many times ad has been shown
  const [tapCount, setTapCount] = useState(0); // Track post taps

  useEffect(() => {
    console.log('Initializing interstitial ad with ID:', adUnitId);
    
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded successfully');
      setIsLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      setIsLoaded(false);
      setAdShowCount(prev => {
        const newCount = prev + 1;
        console.log(`Ad shown count: ${newCount}/3`);
        return newCount;
      });
      
      // Reload ad if we haven't reached the limit of 3
      if (adShowCount < 2) { // Will be 3 total after this increment
        console.log(`Reloading ad (${adShowCount + 1}/3 shown)`);
        interstitial.load();
      } else {
        console.log('Reached ad limit (3/3), no more ads this session');
      }
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      setIsLoaded(false);
    });

    // Load the first ad if we haven't reached the limit
    if (adShowCount < 3) {
      interstitial.load();
    }

    // Cleanup function
    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adShowCount]);

  const showAd = async () => {
    if (adShowCount >= 3) {
      console.log('Ad limit reached (3/3), not showing more ads');
      return;
    }
    
    if (isLoaded) {
      try {
        console.log(`Showing interstitial ad (${adShowCount + 1}/3)`);
        await interstitial.show();
      } catch (error) {
        console.log('Error showing interstitial ad:', error);
      }
    } else {
      console.log('Interstitial ad not loaded yet');
    }
  };

  // Show ad only on fourth post tap
  const maybeShowAd = () => {
    if (adShowCount >= 3) {
      console.log('Ad limit reached (3/3), skipping');
      return;
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    console.log(`Post tap count: ${newTapCount}`);
    
    if (newTapCount === 4 && isLoaded) {
      console.log('Triggering interstitial ad on fourth post tap');
      showAd();
      setTapCount(0); // Reset tap count after showing ad
    } else if (newTapCount === 4 && !isLoaded) {
      console.log('Fourth post tap reached but ad not loaded yet');
      setTapCount(0); // Reset anyway
    }
  };

  return {
    isLoaded,
    showAd,
    maybeShowAd,
    adShowCount, // Expose this for debugging
    tapCount, // Expose this for debugging
  };
}