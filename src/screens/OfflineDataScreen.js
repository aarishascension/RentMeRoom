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
import { OfflineDataManager, OfflineStorage, PendingActions, useNetworkStatus } from '../services/offline';

export default function OfflineDataScreen({ navigation }) {
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [cacheData, setCacheData] = useState({
    posts: 0,
    messages: 0,
    images: 0,
    totalSize: '0 MB',
  });
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    try {
      // Load offline mode setting
      const offlineSetting = await AsyncStorage.getItem('offline_mode');
      if (offlineSetting !== null) {
        setOfflineEnabled(JSON.parse(offlineSetting));
      }

      // Load cached data info
      const cachedPosts = await OfflineDataManager.getCachedPosts();
      const cachedMessages = await OfflineDataManager.getAllCachedMessages();
      const pending = await PendingActions.getAll();

      setCacheData({
        posts: cachedPosts.length,
        messages: cachedMessages.length,
        images: 0, // Would need to implement image cache counting
        totalSize: calculateCacheSize(cachedPosts, cachedMessages),
      });

      setPendingActions(pending);
    } catch (error) {
      console.error('Load offline data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCacheSize = (posts, messages) => {
    // Rough estimation of cache size
    const postsSize = posts.length * 2; // ~2KB per post
    const messagesSize = messages.length * 1; // ~1KB per message
    const totalKB = postsSize + messagesSize;
    
    if (totalKB < 1024) {
      return `${totalKB} KB`;
    } else {
      return `${(totalKB / 1024).toFixed(1)} MB`;
    }
  };

  const toggleOfflineMode = async (value) => {
    setOfflineEnabled(value);
    await AsyncStorage.setItem('offline_mode', JSON.stringify(value));
    
    if (value) {
      Alert.alert(
        'Offline Mode Enabled',
        'The app will now cache data for offline use and queue actions when disconnected.'
      );
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached posts, messages, and offline data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineStorage.clear();
              await loadOfflineData();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const syncPendingActions = async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please connect to the internet to sync pending actions');
      return;
    }

    try {
      const { SyncManager } = await import('../services/offline');
      await SyncManager.syncPendingActions();
      await loadOfflineData();
      Alert.alert('Success', 'All pending actions have been synced');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync some actions');
    }
  };

  const clearPendingActions = () => {
    Alert.alert(
      'Clear Pending Actions',
      'This will remove all queued actions. They will not be synced. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await PendingActions.clear();
              await loadOfflineData();
              Alert.alert('Success', 'Pending actions cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear pending actions');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ icon, title, value, subtitle, color }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoValue}>{value}</Text>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle && <Text style={styles.infoSubtitle}>{subtitle}</Text>}
      </View>
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
            <Text style={styles.headerTitle}>Offline Data</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading offline data...</Text>
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
          <Text style={styles.headerTitle}>Offline Data</Text>
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
        {/* Offline Mode Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Mode</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-offline" size={20} color="#9333EA" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Enable Offline Mode</Text>
                <Text style={styles.settingSubtitle}>Cache data and queue actions when offline</Text>
              </View>
            </View>
            <Switch
              value={offlineEnabled}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: '#D1D5DB', true: '#9333EA' }}
              thumbColor={offlineEnabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Cache Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cached Data</Text>
          <View style={styles.infoGrid}>
            <InfoCard
              icon="document-text"
              title="Posts"
              value={cacheData.posts}
              subtitle="Cached posts"
              color="#3B82F6"
            />
            <InfoCard
              icon="chatbubbles"
              title="Messages"
              value={cacheData.messages}
              subtitle="Cached messages"
              color="#10B981"
            />
            <InfoCard
              icon="images"
              title="Images"
              value={cacheData.images}
              subtitle="Cached images"
              color="#F59E0B"
            />
            <InfoCard
              icon="server"
              title="Total Size"
              value={cacheData.totalSize}
              subtitle="Storage used"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Pending Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Actions</Text>
          <View style={styles.pendingInfo}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.pendingText}>
              {pendingActions.length} actions waiting to sync
            </Text>
          </View>
          
          {pendingActions.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isConnected ? '#10B981' : '#D1D5DB' }]}
                onPress={syncPendingActions}
                disabled={!isConnected}
              >
                <Ionicons name="sync" size={20} color="white" />
                <Text style={styles.actionButtonText}>Sync Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                onPress={clearPendingActions}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Cache Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache Management</Text>
          
          <TouchableOpacity style={styles.manageButton} onPress={clearCache}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.manageButtonText}>Clear All Cache</Text>
            <Text style={styles.manageButtonSubtext}>Free up storage space</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Offline Mode Works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoListItem}>
              <Ionicons name="download" size={16} color="#10B981" />
              <Text style={styles.infoListText}>Automatically caches posts and messages</Text>
            </View>
            <View style={styles.infoListItem}>
              <Ionicons name="cloud-upload" size={16} color="#3B82F6" />
              <Text style={styles.infoListText}>Queues actions when offline</Text>
            </View>
            <View style={styles.infoListItem}>
              <Ionicons name="sync" size={16} color="#F59E0B" />
              <Text style={styles.infoListText}>Syncs automatically when back online</Text>
            </View>
          </View>
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
    paddingVertical: 8,
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  infoTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  manageButtonSubtext: {
    fontSize: 14,
    color: '#EF4444',
  },
  infoList: {
    gap: 12,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoListText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
});