import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { requestNotificationPermissions } from '../services/notifications';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notification settings
      const notifSetting = await AsyncStorage.getItem('notifications_enabled');
      if (notifSetting !== null) {
        setNotificationsEnabled(JSON.parse(notifSetting));
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
    
    if (value) {
      await requestNotificationPermissions();
    }
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleRateApp = () => {
    const packageName = 'com.rentmeroom.app'; // Your app's package name
    const playStoreUrl = `market://details?id=${packageName}`;
    const webPlayStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    
    Alert.alert(
      'Rate Our App',
      'Help us improve by rating RentMeRoom on the Play Store!',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            // Try to open Play Store app first, fallback to web
            Linking.canOpenURL(playStoreUrl).then(supported => {
              if (supported) {
                Linking.openURL(playStoreUrl);
              } else {
                // Fallback to web browser
                Linking.openURL(webPlayStoreUrl).catch(() => {
                  Alert.alert('Error', 'Could not open Play Store. Please search for RentMeRoom in the Play Store app.');
                });
              }
            }).catch(() => {
              // If app is not published yet, show a friendly message
              Alert.alert('Coming Soon', 'The app will be available on Play Store soon. Thank you for your interest!');
            });
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      const appName = 'RentMeRoom';
      const appDescription = 'Find your perfect room or roommate with RentMeRoom!';
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rentmeroom.app'; // Update with actual URL when published
      
      const shareMessage = `${appDescription}\n\nDownload ${appName} now:\n${playStoreUrl}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: `Share ${appName}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('App shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share app');
      console.error('Share error:', error);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help? Contact our support team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            Linking.openURL('mailto:ahsaanaarish@gmail.com?subject=RentMeRoom Support');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    const version = Constants.expoConfig?.version || '1.0.4';
    Alert.alert(
      'About RentMeRoom',
      `RentMeRoom v${version}\n\nFind and list rooms for rent in your area. Connect with verified landlords and tenants safely.\n\nDeveloped with ❤️ for the rental community.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be temporarily disabled. Your posts will be hidden but your data will be preserved. You can reactivate by logging in again.\n\nAre you sure you want to deactivate your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will deactivate your account and sign you out. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Deactivate',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { deactivateAccount } = await import('../services/users');
                      await deactivateAccount();
                      Alert.alert('Account Deactivated', 'Your account has been deactivated successfully.');
                    } catch (error) {
                      Alert.alert('Error', error.message || 'Failed to deactivate account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      '⚠️ WARNING: This action cannot be undone!\n\nThis will permanently delete:\n• Your account and profile\n• All your posts and messages\n• All your data and activity\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'This will PERMANENTLY delete your account and ALL data. This cannot be undone.\n\nType "DELETE" to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { deleteAccount } = await import('../services/users');
                      await deleteAccount();
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                    } catch (error) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#9333EA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Push Notifications</Text>
                <Text style={styles.settingSubtext}>Get notified about new messages and updates</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#9333EA' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleRateApp}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Rate Our App</Text>
              <Text style={styles.menuSubtext}>Help us improve with your feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleShareApp}>
            <Ionicons name="share" size={20} color="#10B981" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Share App</Text>
              <Text style={styles.menuSubtext}>Tell friends about RentMeRoom</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport}>
            <Ionicons name="mail" size={20} color="#3B82F6" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Contact Support</Text>
              <Text style={styles.menuSubtext}>Get help with any issues</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Text style={styles.menuSubtext}>How we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>About RentMeRoom</Text>
              <Text style={styles.menuSubtext}>Version {Constants.expoConfig?.version || '1.0.4'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDeactivateAccount}>
            <Ionicons name="pause-circle" size={20} color="#F59E0B" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Deactivate Account</Text>
              <Text style={styles.menuSubtext}>Temporarily disable your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete Account</Text>
              <Text style={styles.menuSubtext}>Permanently delete all your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Extra padding for gesture bar
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});