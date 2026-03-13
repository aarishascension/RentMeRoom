import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';

export default function BannerAdComponent({ style, size = BannerAdSize.BANNER }) {
  const [adLoaded, setAdLoaded] = useState(false);

  const handleAdLoaded = () => {
    setAdLoaded(true);
  };

  const handleAdFailedToLoad = (error) => {
    console.log('Banner ad failed to load:', error);
    setAdLoaded(false);
  };

  if (!ADMOB_CONFIG.AD_UNITS.BANNER) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={ADMOB_CONFIG.AD_UNITS.BANNER}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});