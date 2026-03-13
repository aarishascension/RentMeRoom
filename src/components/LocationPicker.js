import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function LocationPicker({ visible, onClose, onLocationSelect, initialLocation = '' }) {
  const [region, setRegion] = useState({
    latitude: 19.0760, // Mumbai coordinates
    longitude: 72.8777,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [address, setAddress] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (visible) {
      console.log('🗺️ LocationPicker - Modal opened, initializing...');
      setMapReady(false);
      setMapError(null);
      getCurrentLocation();
      
      // Set a timeout to hide loading overlay if map doesn't load
      const timeout = setTimeout(() => {
        console.log('🗺️ LocationPicker - Map loading timeout, assuming ready');
        setMapReady(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [visible]); // Remove mapReady from dependencies to prevent infinite loop

  const getCurrentLocation = async () => {
    try {
      console.log('🗺️ LocationPicker - Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        console.log('🗺️ LocationPicker - Location permission granted, getting current position...');
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        console.log('🗺️ LocationPicker - Current location:', currentLocation.coords);
        
        const newRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        
        setRegion(newRegion);
        setMarkerCoordinate({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        // Get address for current location
        await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
      } else {
        console.log('🗺️ LocationPicker - Location permission denied');
      }
    } catch (error) {
      console.error('🗺️ LocationPicker - Location error:', error);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      setLoading(true);
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result && result[0]) {
        const locationString = [
          result[0].name,
          result[0].street,
          result[0].city,
          result[0].region,
        ].filter(Boolean).join(', ');
        setAddress(locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarkerCoordinate(coordinate);
    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  const handleConfirm = () => {
    if (address.trim()) {
      onLocationSelect(address.trim(), markerCoordinate);
      onClose();
    } else {
      Alert.alert('Error', 'Please select a location or enter an address');
    }
  };

  const searchLocation = async () => {
    if (!address.trim()) return;
    
    try {
      setLoading(true);
      const result = await Location.geocodeAsync(address);
      if (result && result[0]) {
        const coordinate = {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
        
        const newRegion = {
          ...coordinate,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        
        setRegion(newRegion);
        setMarkerCoordinate(coordinate);
      } else {
        Alert.alert('Error', 'Location not found. Please try a different address.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={searchLocation}
          />
          <TouchableOpacity onPress={searchLocation} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#9333EA" />
          </TouchableOpacity>
        </View>

        <MapView
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          onMapReady={() => {
            console.log('🗺️ LocationPicker - Map is ready!');
            setMapReady(true);
          }}
          onError={(error) => {
            console.error('🗺️ LocationPicker - Map error:', error);
            setMapError(error);
          }}
          onLayout={() => {
            console.log('🗺️ LocationPicker - Map layout complete');
          }}
        >
          {markerCoordinate && (
            <Marker
              coordinate={markerCoordinate}
              title="Selected Location"
              description={address}
            />
          )}
        </MapView>

        {!mapReady && !mapError && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#9333EA" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
            <Text style={styles.mapLoadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {mapError && (
          <View style={styles.mapErrorOverlay}>
            <Ionicons name="warning" size={48} color="#EF4444" />
            <Text style={styles.mapErrorTitle}>Map Error</Text>
            <Text style={styles.mapErrorText}>
              Unable to load map. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setMapError(null);
                setMapReady(false);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#9333EA" />
          <Text style={styles.addressText}>
            {loading ? 'Getting address...' : address || 'Tap on map to select location'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9333EA',
    borderRadius: 8,
  },
  confirmText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  mapLoadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  mapErrorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});