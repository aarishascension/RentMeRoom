import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { requestNotificationPermissions } from '../services/notifications';

export default function NotificationsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    newMessages: true,
    postReplies: true,
    postLikes: true,
    newPosts: false,
    marketingEmails: false,
    weeklyDigest: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Load notification settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));

      // Handle push notification permission
      if (key === 'pushNotifications' && value) {
        try {
          await requestNotificationPermissions();
        } catch (error) {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings');
        }
      }
    } catch (error) {
      console.error('Update notification setting error:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            const defaultSettings = {
              pushNotifications: true,
              newMessages: true,
              postReplies: true,
              postLikes: true,
              newPosts: false,
              marketingEmails: false,
              weeklyDigest: true,
              soundEnabled: true,
              vibrationEnabled: true,
            };
            setSettings(defaultSettings);
            await AsyncStorage.setItem('notification_settings', JSON.stringify(defaultSettings));
            Alert.alert('Success', 'Settings reset to default');
          },
        },
      ]
    );
  };

  const SettingItem = ({ title, subtitle, value, onValueChange, icon, iconColor }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#9333EA' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          <SettingItem
            title="Enable Push Notifications"
            subtitle="Receive notifications on your device"
            value={settings.pushNotifications}
            onValueChange={(value) => updateSetting('pushNotifications', value)}
            icon="notifications"
            iconColor="#9333EA"
          />
        </View>

        {/* Content Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Notifications</Text>
          
          <SettingItem
            title="New Messages"
            subtitle="When someone sends you a message"
            value={settings.newMessages}
            onValueChange={(value) => updateSetting('newMessages', value)}
            icon="chatbubble"
            iconColor="#10B981"
          />
          
          <SettingItem
            title="Post Replies"
            subtitle="When someone replies to your posts"
            value={settings.postReplies}
            onValueChange={(value) => updateSetting('postReplies', value)}
            icon="chatbubbles"
            iconColor="#3B82F6"
          />
          
          <SettingItem
            title="Post Likes"
            subtitle="When someone likes your posts"
            value={settings.postLikes}
            onValueChange={(value) => updateSetting('postLikes', value)}
            icon="heart"
            iconColor="#EF4444"
          />
          
          <SettingItem
            title="New Posts in Area"
            subtitle="When new posts are created in your area"
            value={settings.newPosts}
            onValueChange={(value) => updateSetting('newPosts', value)}
            icon="location"
            iconColor="#F59E0B"
          />
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          
          <SettingItem
            title="Marketing Emails"
            subtitle="Promotional offers and updates"
            value={settings.marketingEmails}
            onValueChange={(value) => updateSetting('marketingEmails', value)}
            icon="mail"
            iconColor="#8B5CF6"
          />
          
          <SettingItem
            title="Weekly Digest"
            subtitle="Summary of activity and new listings"
            value={settings.weeklyDigest}
            onValueChange={(value) => updateSetting('weeklyDigest', value)}
            icon="newspaper"
            iconColor="#EC4899"
          />
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          
          <SettingItem
            title="Sound"
            subtitle="Play sound for notifications"
            value={settings.soundEnabled}
            onValueChange={(value) => updateSetting('soundEnabled', value)}
            icon="volume-high"
            iconColor="#10B981"
          />
          
          <SettingItem
            title="Vibration"
            subtitle="Vibrate for notifications"
            value={settings.vibrationEnabled}
            onValueChange={(value) => updateSetting('vibrationEnabled', value)}
            icon="phone-portrait"
            iconColor="#6B7280"
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Ionicons name="refresh" size={20} color="#EF4444" />
            <Text style={styles.resetButtonText}>Reset to Default</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
});