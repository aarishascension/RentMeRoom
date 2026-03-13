// Geocoding service for converting text locations to coordinates
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const geocodeLocation = async (address) => {
  try {
    if (!address || !address.trim()) {
      throw new Error('Address is required');
    }

    console.log('🌍 Geocoding address:', address);
    
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `${GEOCODING_API_URL}?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const coordinates = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
      
      console.log('✅ Geocoding successful:', coordinates);
      return coordinates;
    } else {
      console.warn('⚠️ Geocoding failed:', data.status, data.error_message);
      
      // Fallback: Try to extract coordinates from Plus Code if present
      if (address.includes('+')) {
        return await geocodePlusCode(address);
      }
      
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    
    // Fallback to default Mumbai coordinates for Indian locations
    if (address.toLowerCase().includes('mumbai') || 
        address.toLowerCase().includes('india')) {
      console.log('🏠 Using fallback Mumbai coordinates');
      return {
        latitude: 19.0760,
        longitude: 72.8777,
        formattedAddress: `${address} (approximate location)`
      };
    }
    
    throw error;
  }
};

// Helper function to handle Plus Codes (like 4QFH+CRJ)
const geocodePlusCode = async (plusCode) => {
  try {
    // Extract the Plus Code part
    const plusCodeMatch = plusCode.match(/[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,3}/i);
    if (plusCodeMatch) {
      const code = plusCodeMatch[0];
      const url = `${GEOCODING_API_URL}?address=${encodeURIComponent(code)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address
        };
      }
    }
    
    throw new Error('Plus Code geocoding failed');
  } catch (error) {
    console.error('❌ Plus Code geocoding error:', error);
    throw error;
  }
};

// Batch geocoding for multiple addresses
export const geocodeMultipleLocations = async (addresses) => {
  const results = [];
  
  for (const address of addresses) {
    try {
      const coordinates = await geocodeLocation(address);
      results.push({ address, coordinates, success: true });
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to geocode ${address}:`, error);
      results.push({ address, error: error.message, success: false });
    }
  }
  
  return results;
};

// Reverse geocoding - convert coordinates to address
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `${GEOCODING_API_URL}?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      throw new Error(`Reverse geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    throw error;
  }
};