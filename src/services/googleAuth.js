import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Configure Google Sign-in with your Firebase Web Client ID
GoogleSignin.configure({
  webClientId: '493445910286-5d3gkiv7in0oh03as7dshssi90dld6tf.apps.googleusercontent.com', // ✅ Your actual Web Client ID from Firebase
  offlineAccess: false, // Changed to false to get idToken instead of serverAuthCode
  hostedDomain: '',
  forceCodeForRefreshToken: false, // Changed to false
});

export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Starting Google Sign-in...');
    
    // Check if device supports Google Play Services
    console.log('📱 Checking Google Play Services...');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('✅ Google Play Services available');
    
    // Sign out any existing user first to ensure clean state
    console.log('🔄 Signing out any existing user...');
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      console.log('ℹ️ No existing user to sign out');
    }
    
    // Get user info from Google
    console.log('🔑 Initiating Google Sign-in...');
    const userInfo = await GoogleSignin.signIn();
    console.log('📋 Google Sign-in response keys:', Object.keys(userInfo));
    
    // Check if user cancelled the sign-in
    if (userInfo.type === 'cancelled') {
      console.log('ℹ️ User cancelled Google Sign-in');
      // Throw a special error that won't be logged as an error
      const cancelError = new Error('SIGN_IN_CANCELLED');
      cancelError.isUserCancellation = true;
      throw cancelError;
    }
    
    // Log the full response for debugging
    console.log('📋 Full Google Sign-in response:', JSON.stringify(userInfo, null, 2));
    
    // Extract ID token - try multiple possible locations
    let idToken = null;
    
    // Log the structure for debugging
    console.log('🔍 Analyzing userInfo structure:');
    console.log('- userInfo keys:', Object.keys(userInfo));
    if (userInfo.data) {
      console.log('- userInfo.data keys:', Object.keys(userInfo.data));
      if (userInfo.data.user) {
        console.log('- userInfo.data.user keys:', Object.keys(userInfo.data.user));
      }
    }
    if (userInfo.user) {
      console.log('- userInfo.user keys:', Object.keys(userInfo.user));
    }
    
    // Try different possible locations for the ID token
    if (userInfo.idToken) {
      idToken = userInfo.idToken;
      console.log('✅ Found idToken at userInfo.idToken');
    } else if (userInfo.data?.idToken) {
      idToken = userInfo.data.idToken;
      console.log('✅ Found idToken at userInfo.data.idToken');
    } else if (userInfo.data?.user?.idToken) {
      idToken = userInfo.data.user.idToken;
      console.log('✅ Found idToken at userInfo.data.user.idToken');
    } else if (userInfo.user?.idToken) {
      idToken = userInfo.user.idToken;
      console.log('✅ Found idToken at userInfo.user.idToken');
    } else {
      // Try to get tokens using getTokens method
      console.log('🔄 Trying to get tokens using getTokens method...');
      try {
        const tokens = await GoogleSignin.getTokens();
        console.log('📋 Tokens response:', Object.keys(tokens));
        if (tokens.idToken) {
          idToken = tokens.idToken;
          console.log('✅ Found idToken using getTokens method');
        }
      } catch (tokenError) {
        console.log('⚠️ getTokens failed:', tokenError.message);
      }
    }
    
    if (!idToken) {
      console.error('❌ No ID token found in any expected location');
      console.error('Available keys in userInfo:', Object.keys(userInfo));
      if (userInfo.data) {
        console.error('Available keys in userInfo.data:', Object.keys(userInfo.data));
      }
      if (userInfo.user) {
        console.error('Available keys in userInfo.user:', Object.keys(userInfo.user));
      }
      
      // Try one more approach - check if we have serverAuthCode
      if (userInfo.serverAuthCode || userInfo.data?.serverAuthCode) {
        const serverAuthCode = userInfo.serverAuthCode || userInfo.data?.serverAuthCode;
        console.log('⚠️ No idToken found, but serverAuthCode is available:', !!serverAuthCode);
        throw new Error('Google Sign-in returned serverAuthCode instead of idToken. This suggests a configuration issue with the webClientId.');
      }
      
      throw new Error('No ID token received from Google Sign-in. Please check your Firebase configuration and ensure webClientId is correct.');
    }
    
    console.log('✅ ID Token received (length):', idToken.length);
    console.log('✅ Google Sign-in successful for:', userInfo.user?.email || 'unknown user');
    
    // Get Google credential
    console.log('🔐 Creating Firebase credential...');
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase with Google credential
    console.log('🔥 Signing in to Firebase...');
    const result = await signInWithCredential(auth, googleCredential);
    console.log('✅ Firebase authentication successful:', result.user.uid);
    
    return result.user;
  } catch (error) {
    // Don't log errors for user cancellations
    if (error.isUserCancellation || error.message === 'SIGN_IN_CANCELLED') {
      throw new Error('SIGN_IN_CANCELLED');
    }
    
    console.error('❌ Google Sign-in error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    if (error.code === 'SIGN_IN_CANCELLED' || error.message === 'SIGN_IN_CANCELLED') {
      throw new Error('Google Sign-in was cancelled by user');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    } else if (error.code === 'SIGN_IN_REQUIRED') {
      throw new Error('Google Sign-in required. Please try again.');
    } else {
      throw new Error(`Google Sign-in failed: ${error.message}`);
    }
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-out successful');
  } catch (error) {
    console.error('❌ Google Sign-out error:', error);
  }
};

export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    console.log('No Google user signed in');
    return null;
  }
};

export const checkGoogleSignInConfiguration = async () => {
  try {
    console.log('🔧 Checking Google Sign-in configuration...');
    
    // Check if Google Sign-in is configured
    const isConfigured = await GoogleSignin.isSignedIn();
    console.log('📋 Google Sign-in configured:', isConfigured);
    
    // Check Play Services
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    console.log('📱 Google Play Services available:', hasPlayServices);
    
    // Get current user if any
    const currentUser = await GoogleSignin.getCurrentUser();
    console.log('👤 Current Google user:', currentUser ? 'Signed in' : 'Not signed in');
    
    return {
      isConfigured,
      hasPlayServices,
      currentUser: !!currentUser
    };
  } catch (error) {
    console.error('❌ Configuration check error:', error);
    return {
      isConfigured: false,
      hasPlayServices: false,
      currentUser: false,
      error: error.message
    };
  }
};