import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAdUnitId } from '../config/admob';

const adUnitId = getAdUnitId('native');

export default function GoogleNativeAd({ style }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('Loading native ad with ID:', adUnitId);
    
    // Simulate loading delay for demo
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('Demo native ad loaded successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading native ad...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.adContainer}>
        {/* Ad Badge */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        
        {/* Demo Native Ad Content */}
        <Text style={styles.headline} numberOfLines={2}>
          Find Your Perfect Room Today
        </Text>
        
        <Text style={styles.body} numberOfLines={3}>
          Discover amazing rental properties in your area. Safe, verified listings with instant booking. Join thousands of happy renters!
        </Text>
        
        <TouchableOpacity style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Learn More</Text>
        </TouchableOpacity>
        
        <Text style={styles.advertiser}>
          By RentMeRoom Demo
        </Text>
        
        {/* Demo indicator */}
        <Text style={styles.demoIndicator}>
          📱 Demo Native Ad (ID: {adUnitId.slice(-10)}...)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  adContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  headline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ctaContainer: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ctaText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  advertiser: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  demoIndicator: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});