import * as Location from 'expo-location';

// Country codes and names
export const COUNTRIES = {
  IN: { code: 'IN', name: 'India', flag: '🇮🇳' },
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  AE: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
};

// Detect user's country from device (simplified - defaults to India)
export const detectCountryFromLocale = () => {
  try {
    // Default to India
    // Users can manually select their country in the app
    console.log('📍 Using default country: IN');
    return 'IN';
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'IN';
  }
};

// Detect user's country from GPS location
export const detectCountryFromGPS = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    // Reverse geocode to get country
    const [address] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (address?.isoCountryCode && COUNTRIES[address.isoCountryCode]) {
      console.log('📍 Country detected from GPS:', address.isoCountryCode);
      return address.isoCountryCode;
    }

    return null;
  } catch (error) {
    console.error('Error detecting country from GPS:', error);
    return null;
  }
};

// Get user's country (tries GPS first, falls back to default)
export const getUserCountry = async () => {
  // Try GPS first
  const gpsCountry = await detectCountryFromGPS();
  if (gpsCountry) {
    return gpsCountry;
  }

  // Fallback to default (India)
  return detectCountryFromLocale();
};

// Get country name from code
export const getCountryName = (countryCode) => {
  return COUNTRIES[countryCode]?.name || 'Unknown';
};

// Get country flag from code
export const getCountryFlag = (countryCode) => {
  return COUNTRIES[countryCode]?.flag || '🌍';
};

// Get all countries for dropdown
export const getAllCountries = () => {
  return Object.values(COUNTRIES);
};
