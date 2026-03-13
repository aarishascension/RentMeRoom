import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../config/admob';

export default function GoogleBannerAd({ style, onAdLoaded, onAdFailedToLoad }) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(null);

  const handleAdLoaded = () => {
    console.log('Banner ad loaded successfully');
    setAdLoaded(true);
    setAdError(null);
    onAdLoaded?.();
  };

  const handleAdFailedToLoad = (error) => {
    console.log('Banner ad failed to load:', error);
    setAdLoaded(false);
    setAdError(error);
    onAdFailedToLoad?.(error);
  };

  const handleAdClicked = () => {
    console.log('Banner ad clicked');
  };

  const handleAdImpression = () => {
    console.log('Banner ad impression recorded');
  };

  const handleAdOpened = () => {
    console.log('Banner ad opened overlay');
  };

  const handleAdClosed = () => {
    console.log('Banner ad closed, user returned to app');
  };

  return (
    <View style={[styles.container, style]}>
      {/* Ad view container that fills the width and adjusts height to content */}
      <View style={styles.adViewContainer}>
        <BannerAd
          unitId={getAdUnitId('banner')}
          size={BannerAdSize.LARGE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoad}
          onAdClicked={handleAdClicked}
          onAdImpression={handleAdImpression}
          onAdOpened={handleAdOpened}
          onAdClosed={handleAdClosed}
        />
      </View>
      
      {/* Development info */}
      {__DEV__ && (
        <View style={styles.devInfo}>
          <Text style={styles.devText}>
            {adLoaded ? '✅ Google Demo Banner Ad Loaded' : '⏳ Loading Google Demo Ad...'}
          </Text>
          <Text style={styles.devText}>
            ID: {getAdUnitId('banner')}
          </Text>
          {adError && (
            <Text style={styles.errorText}>
              Error: {adError.message || 'Failed to load'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    // Removed paddingHorizontal to make banner full-width
  },
  adViewContainer: {
    width: '100%',
    alignItems: 'center',
    // Container fills width and adjusts height to ad content
    minHeight: 50, // Minimum height for banner
    paddingHorizontal: 0, // Let the parent container handle padding
  },
  devInfo: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  devText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 9,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 2,
  },
});