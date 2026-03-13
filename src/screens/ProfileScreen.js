import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import { getBlockedUsers } from '../services/moderation';
import { useNetworkStatus } from '../services/offline';
import { getUserProfile, getUserStats } from '../services/users';
import { getVerificationBadge } from '../services/verification';

const MENU_ITEMS = [
  { id: 1, icon: '📝', title: 'My Posts', subtitle: 'View all your listings', screen: 'MyPosts' },
  { id: 2, icon: '❤️', title: 'Favorites', subtitle: 'Saved rooms', screen: 'Favorites' },
  // { id: 5, icon: '👤', title: 'Change Username', subtitle: 'Update your display name', action: 'changeUsername' },
  // { id: 6, icon: '✅', title: 'Verification', subtitle: 'Verify your account', screen: 'Verification' },
  { id: 7, icon: '🚫', title: 'Blocked Users', subtitle: 'Manage blocked accounts', screen: 'BlockedUsers' },
  { id: 8, icon: '🔔', title: 'Notifications', subtitle: 'Manage alerts', screen: 'Notifications' },
  // { id: 9, icon: '📱', title: 'Offline Data', subtitle: 'Cached content', screen: 'OfflineData' },
  { id: 10, icon: '⚙️', title: 'Settings', subtitle: 'App preferences', screen: 'Settings' },
  // { id: 11, icon: '❓', title: 'Help & Support', subtitle: 'Get assistance', screen: 'Help' },
];

export default function ProfileScreen({ navigation, onLogout }) {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState({
    name: 'Loading...',
    phone: '',
    email: '',
    memberSince: '',
    avatar: '👤',
  });

  const [stats, setStats] = useState({
    posts: 0,
    responses: 0,
    views: 0,
  });

  const [loading, setLoading] = useState(true);
  const [verificationBadge, setVerificationBadge] = useState(null);
  const [blockedCount, setBlockedCount] = useState(0);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading user data...');
      
      const [profile, userStats, verification, blocked] = await Promise.all([
        getUserProfile(),
        getUserStats(),
        getVerificationBadge(),
        getBlockedUsers(),
      ]);
      
      console.log('✅ Profile data loaded:', profile);
      console.log('📊 User stats:', userStats);
      
      setUserData(profile);
      setStats(userStats);
      setVerificationBadge(verification);
      setBlockedCount(blocked.length);
    } catch (error) {
      console.error('❌ Load user data error:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to load profile data';
      if (!isConnected) {
        errorMessage = 'No internet connection. Please check your network and try again.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              if (typeof onLogout === 'function') {
                onLogout();
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    switch (item.screen) {
      case 'MyPosts':
        navigation.navigate('MyPosts');
        break;
      case 'Favorites':
        navigation.navigate('Favorites');
        break;
      // case 'Verification':
      //   handleVerificationPress();
      //   break;
      case 'BlockedUsers':
        navigation.navigate('BlockedUsers');
        break;
      case 'Notifications':
        navigation.navigate('Notifications');
        break;
      // case 'OfflineData':
      //   navigation.navigate('OfflineData');
      //   break;
      // case 'Help':
      //   navigation.navigate('HelpSupport');
      //   break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      default:
        console.log('Navigate to:', item.screen);
    }
  };

  const handleChangeUsername = () => {
    Alert.alert(
      'Change Username',
      'Your username will be updated across all your posts and messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            setNewUsername(userData.name || '');
            setShowUsernameModal(true);
          },
        },
      ]
    );
  };

  const handleUsernameSubmit = async () => {
    if (newUsername && newUsername.trim()) {
      try {
        setLoading(true);
        setShowUsernameModal(false);
        console.log('🔄 Updating username to:', newUsername.trim());
        
        const { updateUsername } = await import('../services/users');
        await updateUsername(newUsername.trim());
        
        console.log('✅ Username update completed, refreshing profile...');
        
        // Add small delay to ensure Firebase has processed the update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force refresh profile data multiple times to ensure update
        await loadUserData(true);
        
        // Additional refresh after another delay
        setTimeout(() => {
          loadUserData(true);
        }, 2000);
        
        Alert.alert(
          'Success!', 
          'Your username has been updated successfully. It will appear in all new posts and messages.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('❌ Username update failed:', error);
        Alert.alert('Error', error.message || 'Failed to update username');
      } finally {
        setLoading(false);
        setNewUsername('');
      }
    }
  };

  // const handleVerificationPress = () => {
  //   if (verificationBadge?.verified) {
  //     Alert.alert(
  //       'Verification Status',
  //       `You are verified with ${verificationBadge.count} method(s): ${verificationBadge.types.join(', ')}`
  //     );
  //   } else {
  //     Alert.alert(
  //       'Account Verification',
  //       'Verification is currently under development.',
  //       [
  //         { text: 'OK', style: 'cancel' },
  //       ]
  //     );
  //   }
  // };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Choose what to update:',
      [
        {
          text: 'Change Username',
          onPress: () => {
            setNewUsername(userData.name || '');
            setShowUsernameModal(true);
          },
        },
        {
          text: 'Change Avatar',
          onPress: () => {
            const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧔', '👱'];
            Alert.alert(
              'Choose Avatar',
              'Select an emoji avatar:',
              avatars.map(emoji => ({
                text: emoji,
                onPress: async () => {
                  try {
                    const { updateUserProfile } = await import('../services/users');
                    await updateUserProfile({ avatar: emoji });
                    await loadUserData();
                    Alert.alert('Success', 'Avatar updated!');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update avatar');
                  }
                },
              })).concat([{ text: 'Cancel', style: 'cancel' }])
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <Text style={styles.headerTitle}>👤 Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarHuge}>{userData?.avatar || '👤'}</Text>
            {verificationBadge?.verified && (
              <View style={styles.verificationBadge}>
                <Text style={styles.verificationIcon}>{verificationBadge.badge}</Text>
              </View>
            )}
          </View>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>
              {loading ? 'Loading...' : (userData.name || 'Unknown User')}
            </Text>
            {verificationBadge?.verified && (
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={styles.verifiedIcon} />
            )}
          </View>
          {userData.phone && <Text style={styles.userPhone}>{userData.phone}</Text>}
          {userData.email && <Text style={styles.userEmail}>{userData.email}</Text>}
          <Text style={styles.memberSince}>
            Member since {userData.memberSince || 'Unknown'}
          </Text>
          
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.connectionText}>{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.responses}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.views}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {Constants.expoConfig?.version || '1.0.4'}</Text>
      </ScrollView>



      {/* Username Change Modal */}
      <Modal
        visible={showUsernameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Username</Text>
            <Text style={styles.modalSubtitle}>
              Enter your new username (2-30 characters)
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              autoFocus={true}
              maxLength={30}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowUsernameModal(false);
                  setNewUsername('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleUsernameSubmit}
                disabled={!newUsername.trim() || newUsername.trim().length < 2}
              >
                <Text style={styles.modalButtonTextSave}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarHuge: {
    fontSize: 80,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  verificationIcon: {
    fontSize: 12,
    color: 'white',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  userPhone: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    marginTop: -50,
  },
  contentContainer: {
    paddingBottom: 100, // Tab bar height + extra spacing for gesture bar
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  menuSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonSave: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

