// Admin utilities for managing app data
import { updatePostsWithCoordinates } from '../services/posts';

// Function to update all existing posts with coordinates
export const runGeocodingUpdate = async () => {
  try {
    console.log('🔧 Admin: Starting geocoding update...');
    
    const result = await updatePostsWithCoordinates();
    
    console.log('🔧 Admin: Geocoding update complete:', result);
    
    return {
      success: true,
      message: `Updated ${result.updated} posts with coordinates. Skipped ${result.skipped}, Errors: ${result.errors}`,
      result
    };
    
  } catch (error) {
    console.error('🔧 Admin: Geocoding update failed:', error);
    return {
      success: false,
      message: `Geocoding update failed: ${error.message}`,
      error
    };
  }
};

// Function to check how many posts have coordinates
export const checkCoordinateStatus = async () => {
  try {
    const { getDocs, collection } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    let withCoordinates = 0;
    let withoutCoordinates = 0;
    let withLocation = 0;
    let withoutLocation = 0;
    
    snapshot.docs.forEach(doc => {
      const post = doc.data();
      
      if (post.coordinates) {
        withCoordinates++;
      } else {
        withoutCoordinates++;
      }
      
      if (post.location) {
        withLocation++;
      } else {
        withoutLocation++;
      }
    });
    
    const status = {
      total: snapshot.docs.length,
      withCoordinates,
      withoutCoordinates,
      withLocation,
      withoutLocation,
      readyForMap: withCoordinates,
      needsGeocoding: withLocation - withCoordinates
    };
    
    console.log('📊 Coordinate status:', status);
    return status;
    
  } catch (error) {
    console.error('📊 Failed to check coordinate status:', error);
    throw error;
  }
};