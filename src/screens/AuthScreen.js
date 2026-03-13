import { LinearGradient } from 'expo-linear-gradient';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/firebase';
import { signInWithGoogle } from '../services/googleAuth';


export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateInputs = () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Missing Password', 'Please enter your password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      // Create the account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      try {
        await sendEmailVerification(result.user);
        
        // Sign out immediately so user must verify first
        await auth.signOut();
        
        Alert.alert(
          'Account Created!',
          'A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the verification link before signing in.',
          [{ text: 'OK' }]
        );
        
        // Switch to sign-in mode
        setIsSignUp(false);
        
      } catch (emailError) {
        Alert.alert(
          'Account Created',
          'Your account was created successfully, but we couldn\'t send the verification email. You can try signing in and we\'ll resend it.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      handleAuthError(error, 'signup');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Optional: Log verification status but don't block
      if (!result.user.emailVerified) {
        console.log('ℹ️ Email not verified (allowing access anyway)');
      }
      
    } catch (error) {
      handleAuthError(error, 'signin');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error, type) => {
    let title = 'Authentication Error';
    let message = 'Something went wrong. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        if (type === 'signup') {
          Alert.alert(
            'Email Already Registered',
            'This email is already registered. Would you like to sign in instead?',
            [
              { text: 'Sign In', onPress: () => setIsSignUp(false) },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }
        break;
        
      case 'auth/user-not-found':
        if (type === 'signin') {
          Alert.alert(
            'Account Not Found',
            'No account found with this email. Would you like to create an account?',
            [
              { text: 'Sign Up', onPress: () => setIsSignUp(true) },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }
        break;
        
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        title = 'Invalid Credentials';
        message = 'The email or password is incorrect. Please check your credentials and try again.';
        break;
        
      case 'auth/invalid-email':
        title = 'Invalid Email';
        message = 'Please enter a valid email address.';
        break;
        
      case 'auth/weak-password':
        title = 'Weak Password';
        message = 'Password must be at least 6 characters long.';
        break;
        
      case 'auth/too-many-requests':
        title = 'Too Many Attempts';
        message = 'Too many failed attempts. Please wait a moment and try again.';
        break;
        
      case 'auth/network-request-failed':
        title = 'Network Error';
        message = 'Please check your internet connection and try again.';
        break;
    }
    
    Alert.alert(title, message);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Handle user cancellation silently
      if (error.message === 'SIGN_IN_CANCELLED') {
        return;
      }
      
      // Show error for other issues
      let message = 'Google Sign-in failed. Please try again.';
      if (error.message.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
        message = 'Google Play Services is not available on this device.';
      } else if (error.message.includes('IN_PROGRESS')) {
        message = 'Sign-in is already in progress. Please wait.';
      }
      
      Alert.alert('Sign-in Error', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link has been sent to ${email}. Please check your email and follow the instructions.`
      );
    } catch (error) {
      let message = 'Unable to send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a moment and try again.';
      }
      
      Alert.alert('Password Reset', message);
    }
  };

  return (
    <LinearGradient
      colors={['#8B5CF6', '#EC4899', '#F97316']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>RentMeRoom</Text>
            <Text style={styles.subtitle}>
              Find your perfect room or roommate
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
            </Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading && !googleLoading}
            />
            
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading && !googleLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading || googleLoading}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={24} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.primaryButton, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading || googleLoading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading || googleLoading}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={loading || googleLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, (googleLoading || loading) && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              <Image 
                source={require('../../assets/google-logo.png')}
                style={styles.googleLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    fontSize: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 12,
    paddingRight: 16,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  switchButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  googleButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleLogo: {
    width: 36,
    height: 36,
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 32,
  },
});