import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { auth } from '../lib/firebase';
import { listenFavorites, listenPosts, mapPostForUI } from '../services/posts';

export default function MapViewScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState({
    latitude: 19.0760, // Mumbai coordinates
    longitude: 72.8777,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  useEffect(() => {
    console.log('🗺️ MapViewScreen - Starting initialization...');
    const unsubPosts = listenPosts((items) => {
      console.log('🗺️ MapViewScreen - Received posts:', items.length);
      
      // Filter posts with valid coordinates
      const postsWithCoords = items.filter(p => 
        p.coordinates?.latitude && 
        p.coordinates?.longitude &&
        !isNaN(p.coordinates.latitude) &&
        !isNaN(p.coordinates.longitude)
      );
      
      console.log('🗺️ MapViewScreen - Posts with valid coordinates:', postsWithCoords.length);
      
      setPosts(items);
      setLoading(false);
      
      // Calculate region to fit all markers
      if (postsWithCoords.length > 0) {
        const lats = postsWithCoords.map(p => p.coordinates.latitude);
        const lngs = postsWithCoords.map(p => p.coordinates.longitude);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const newRegion = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.1),
          longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.1),
        };
        
        console.log('🗺️ MapViewScreen - Setting region:', newRegion);
        setRegion(newRegion);
      }
    });
    
    const uid = auth.currentUser?.uid;
    const unsubFav = uid ? listenFavorites(uid, setFavorites) : () => {};
    
    return () => {
      unsubPosts?.();
      unsubFav?.();
    };
  }, []);

  const handleMarkerPress = (post) => {
    console.log('🗺️ MapViewScreen - Marker pressed:', post.title);
    const mapped = mapPostForUI({ id: post.id, ...post }, favorites || new Set());
    setSelectedPost(mapped);
  };

  const handleCardPress = () => {
    if (selectedPost) {
      console.log('🗺️ MapViewScreen - Navigating to post detail');
      navigation.navigate('PostDetail', { post: selectedPost.raw || selectedPost });
      setSelectedPost(null);
    }
  };

  const handleMapReady = () => {
    console.log('🗺️ MapViewScreen - Map is ready!');
    setMapReady(true);
    setMapError(null);
  };

  const handleMapError = (error) => {
    console.error('🗺️ MapViewScreen - Map error:', error);
    setMapError(error);
    Alert.alert(
      'Map Loading Error',
      'There was an issue loading Google Maps. This might be due to API configuration.',
      [
        { text: 'Retry', onPress: () => {
          setMapError(null);
          setMapReady(false);
        }},
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Filter posts that have valid coordinates
  const postsWithCoordinates = posts.filter(
    p => p.coordinates?.latitude && 
         p.coordinates?.longitude &&
         !isNaN(p.coordinates.latitude) &&
         !isNaN(p.coordinates.longitude)
  );

  console.log('🗺️ MapViewScreen - Render state:', {
    loading,
    mapError: !!mapError,
    mapReady,
    postsTotal: posts.length,
    postsWithCoords: postsWithCoordinates.length
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map View</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>
            {postsWithCoordinates.length} locations
          </Text>
        </View>
      </View>

      {/* Map Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      ) : mapError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🗺️</Text>
          <Text style={styles.errorTitle}>Map Unavailable</Text>
          <Text style={styles.errorText}>
            Google Maps couldn't load. This might be due to API configuration or network issues.
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setMapError(null);
                setMapReady(false);
              }}
            >
              <Text style={styles.retryButtonText}>Retry Map</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton2}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : postsWithCoordinates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No locations on map yet</Text>
          <Text style={styles.emptyText}>
            Properties will appear here once they have location coordinates. New posts automatically get map locations!
          </Text>
          <TouchableOpacity 
            style={styles.createPostsButton}
            onPress={() => {
              navigation.navigate('CreatePost');
            }}
          >
            <Text style={styles.createPostsText}>Create Your First Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onMapReady={handleMapReady}
            onError={handleMapError}
            loadingEnabled={true}
            loadingIndicatorColor="#9333EA"
            loadingBackgroundColor="#F3F4F6"
          >
            {mapReady && postsWithCoordinates.map((post) => {
              const mapped = mapPostForUI({ id: post.id, ...post }, favorites || new Set());
              return (
                <Marker
                  key={post.id}
                  coordinate={{
                    latitude: post.coordinates.latitude,
                    longitude: post.coordinates.longitude,
                  }}
                  title={mapped.title || 'Property'}
                  description={mapped.price || 'View details'}
                  onPress={() => handleMarkerPress(post)}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <Ionicons name="location" size={20} color="white" />
                    </View>
                    <View style={styles.markerArrow} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
          
          {/* Map Status Indicator */}
          {!mapReady && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#9333EA" />
              <Text style={styles.mapLoadingText}>Loading map...</Text>
            </View>
          )}
        </View>
      )}

      {/* Selected Post Card */}
      {selectedPost && (
        <TouchableOpacity 
          style={styles.selectedCard}
          onPress={handleCardPress}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedPost.title || 'Property'}
              </Text>
              <Text style={styles.cardPrice}>{selectedPost.price || 'Price not specified'}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>
                📍 {selectedPost.location || 'Location not specified'}
              </Text>
            </View>
            <TouchableOpacity style={styles.cardButton}>
              <Ionicons name="chevron-forward" size={24} color="#9333EA" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  countText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton2: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createPostsButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#9333EA',
    marginTop: -1,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  cardLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});