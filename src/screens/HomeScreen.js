import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterModal from '../components/FilterModal';
import GoogleBannerAd from '../components/GoogleBannerAd';
import PostCard from '../components/PostCard';
import useSimpleInterstitialAd from '../hooks/useSimpleInterstitialAd';
import { auth } from '../lib/firebase';
import { getUserCountry } from '../services/location';
import { listenFavorites, listenPostsWithReplies, mapPostForUI, toggleFavorite } from '../services/posts';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userCountry, setUserCountry] = useState('IN'); // User's detected country
  const [filters, setFilters] = useState({ 
    location: '', 
    types: [], 
    rentRange: { min: 0, max: 0 }, 
    amenities: [], 
    preferences: [] 
  });

  // Initialize interstitial ads
  const { maybeShowAd } = useSimpleInterstitialAd();

  // Detect user's country on mount
  useEffect(() => {
    getUserCountry().then(country => {
      setUserCountry(country);
      console.log('HomeScreen: User country detected:', country);
    });
  }, []);

  useEffect(() => {
    let unsubPosts = () => {};
    let unsubFav = () => {};
    
    // Wait for authentication state to be determined
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('HomeScreen: User authenticated, setting up listeners with delay');
        
        // Add a delay to ensure authentication is fully complete
        setTimeout(() => {
          // Double-check user is still authenticated
          if (auth.currentUser) {
            console.log('HomeScreen: Setting up posts listener');
            unsubPosts = listenPostsWithReplies((items) => {
              console.log('HomeScreen: Received posts:', items.length);
              setPosts(items);
            });
            
            console.log('HomeScreen: Setting up favorites listener');
            unsubFav = listenFavorites(auth.currentUser.uid, (favs) => {
              console.log('HomeScreen: Received favorites:', favs.size);
              setFavorites(favs);
            });
          } else {
            console.log('HomeScreen: User no longer authenticated, skipping listener setup');
          }
        }, 1000); // 1 second delay to ensure auth is complete
      } else {
        // User not authenticated, clear data
        console.log('HomeScreen: User not authenticated, clearing data');
        setPosts([]);
        setFavorites(new Set());
      }
    });
    
    return () => {
      console.log('HomeScreen: Cleaning up listeners');
      unsubAuth?.();
      unsubPosts?.();
      unsubFav?.();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handlePostPress = (mapped) => {
    console.log('🏠 HomeScreen - Navigating with mapped data:', {
      id: mapped.id,
      likedByUser: mapped.likedByUser,
      likes: mapped.likes,
      hasRaw: !!mapped.raw
    });
    
    // Show interstitial ad occasionally
    maybeShowAd();
    
    navigation.navigate('PostDetail', { post: mapped });
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDeleteAllPosts = () => {
    Alert.alert(
      'Delete All Posts',
      'Are you sure you want to delete ALL posts in the database? This action cannot be undone and will affect all users.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting to delete all posts...');
              
              // Direct implementation as backup
              const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
              const { db } = await import('../lib/firebase');
              
              const postsRef = collection(db, 'posts');
              const querySnapshot = await getDocs(postsRef);
              
              if (querySnapshot.empty) {
                Alert.alert('Info', 'No posts found to delete.');
                return;
              }
              
              const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);
              
              Alert.alert(
                'Success',
                `Successfully deleted ${querySnapshot.docs.length} posts from the database.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Error deleting all posts:', error);
              Alert.alert(
                'Error',
                `Failed to delete posts: ${error.message}`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const filteredPosts = posts.filter((p) => {
    const mapped = mapPostForUI({ id: p.id, ...p }, favorites || new Set(), p.repliesCount || 0);
    
    // Country filter - show only posts from user's country (no global option)
    const matchesCountry = !p.country || p.country === userCountry;
    
    // Location filter - improved to match exact location or partial match
    const matchesLocation = !filters.location || 
      (mapped.location || '').toLowerCase().includes(filters.location.toLowerCase());
    
    // Property type filter - improved to check title, description, and type field
    const matchesType = filters.types.length === 0 || 
      filters.types.some(type => {
        const searchText = `${mapped.title || ''} ${mapped.description || ''} ${mapped.type || ''}`.toLowerCase();
        return searchText.includes(type.toLowerCase());
      });
    
    // Rent range filter - improved to parse price from text
    const matchesRent = !filters.rentRange || filters.rentRange.max === 0 || (() => {
      const priceText = mapped.price || '';
      const priceMatch = priceText.match(/[\d,]+/);
      if (!priceMatch) return true; // If no price found, include in results
      const price = parseInt(priceMatch[0].replace(/,/g, ''));
      return price >= filters.rentRange.min && (filters.rentRange.max === 999999 || price <= filters.rentRange.max);
    })();
    
    // Amenities filter - improved search in all text fields
    const matchesAmenities = filters.amenities.length === 0 || 
      filters.amenities.some(amenity => {
        const searchText = `${mapped.title || ''} ${mapped.description || ''}`.toLowerCase();
        return searchText.includes(amenity.toLowerCase());
      });
    
    // Preferences filter - improved search in all text fields
    const matchesPreferences = filters.preferences.length === 0 || 
      filters.preferences.some(preference => {
        const searchText = `${mapped.title || ''} ${mapped.description || ''}`.toLowerCase();
        return searchText.includes(preference.toLowerCase());
      });
    
    return matchesCountry && matchesLocation && matchesType && matchesRent && matchesAmenities && matchesPreferences;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F97316']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>RentMeRoom</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                console.log('🗺️ Map button pressed - navigating to MapView');
                navigation.navigate('MapView');
              }}
            >
              <Ionicons name="map" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                console.log('Filter button pressed');
                setShowFilterModal(true);
              }}
            >
              <Ionicons name="filter" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                // Navigate to notifications screen or show notifications modal
                Alert.alert('Notifications', 'No new notifications');
              }}
            >
              <Ionicons name="notifications-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {/* Banner Ad at top */}
        <GoogleBannerAd style={styles.topBanner} />
        
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptyText}>
              {filters.location || filters.types.length > 0 
                ? 'Try adjusting your filters' 
                : 'Be the first to create a post!'}
            </Text>
          </View>
        ) : (
          filteredPosts.map((p, index) => {
            const mapped = mapPostForUI({ id: p.id, ...p }, favorites || new Set(), p.repliesCount || 0);
            return (
              <View key={mapped.id}>
                <PostCard
                  post={mapped}
                  onPress={() => handlePostPress(mapped)}
                  onLike={() => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) return;
                    toggleFavorite(uid, mapped.id, mapped.likedByUser);
                  }}
                  navigation={navigation}
                />
                {/* Show banner ad after every 3rd post */}
                {(index + 1) % 3 === 0 && <GoogleBannerAd style={styles.midBanner} />}
              </View>
            );
          })
        )}
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  countryBadge: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countryBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100 + 20, // Tab bar height + extra spacing for gesture bar
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  topBanner: {
    marginBottom: 8,
    marginHorizontal: -16, // Negative margin to make full-width
  },
  midBanner: {
    marginVertical: 8,
    marginHorizontal: -16, // Negative margin to make full-width
  },
  bottomBanner: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: -16, // Negative margin to make full-width
  },
});
