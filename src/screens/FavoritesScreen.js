import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PostCard from '../components/PostCard';
import { auth, db } from '../lib/firebase';
import { listenPosts, toggleFavorite } from '../services/posts';

export default function FavoritesScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsubFavorites = () => {};
    let unsubPosts = () => {};
    
    console.log('FavoritesScreen: Component mounted');

    // Wait for authentication state to be determined
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('FavoritesScreen: User authenticated, setting up listeners');
        
        // Add a small delay to ensure auth is fully complete
        setTimeout(() => {
          // Listen to favorites directly
          const favRef = collection(db, 'users', user.uid, 'favorites');
          unsubFavorites = onSnapshot(
            favRef,
            (snap) => {
              const ids = new Set(snap.docs.map((d) => d.id));
              console.log('FavoritesScreen: Favorites updated:', ids.size, 'favorites:', Array.from(ids));
              setFavorites(ids);
            },
            (error) => {
              console.error('Favorites listener error:', error);
              // Don't show error for permission issues, just clear favorites
              setFavorites(new Set());
            }
          );

          // Listen to all posts
          unsubPosts = listenPosts((allPosts) => {
            console.log('FavoritesScreen: Posts received:', allPosts.length);
            setPosts(allPosts);
            setLoading(false);
            setRefreshing(false);
          });
        }, 500); // 500ms delay to ensure auth is complete
      } else {
        // User not authenticated, clear data
        console.log('FavoritesScreen: User not authenticated');
        setFavorites(new Set());
        setPosts([]);
        setLoading(false);
      }
    });

    return () => {
      console.log('FavoritesScreen: Component unmounting');
      unsubAuth?.();
      unsubFavorites?.();
      unsubPosts?.();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  // Filter posts that are in favorites (without mapping for now)
  const favoritePosts = posts.filter(post => {
    const postId = post.id;
    const isFavorite = favorites.has(postId);
    return isFavorite;
  }).map(post => ({
    ...post,
    question: post.title || post.description || 'Post',
    likedByUser: favorites.has(post.id),
    likes: favorites.has(post.id) ? 1 : 0,
    replies: 0,
    user: {
      name: post.userName || 'User',
      avatar: (post.userName || 'U').slice(0, 2).toUpperCase(),
      verified: post.user?.verified === true,
    },
    time: post.createdAt?.toDate ? (() => {
      const date = post.createdAt.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      else if (diffMins < 60) return `${diffMins}m ago`;
      else if (diffHours < 24) return `${diffHours}h ago`;
      else if (diffDays < 7) return `${diffDays}d ago`;
      else return date.toLocaleDateString();
    })() : '',
    raw: post,
  }));

  console.log('FavoritesScreen: Favorite posts filtered:', favoritePosts.length, 'from', posts.length, 'total posts');

  const handleLike = async (post) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('User not authenticated, cannot toggle favorite');
        return;
      }
      
      const postId = post.raw?.id || post.id;
      const isCurrentlyFavorite = favorites.has(postId);
      await toggleFavorite(user.uid, postId, isCurrentlyFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postWrapper}>
      <PostCard
        post={item}
        onPress={() => handlePostPress(item)}
        onLike={() => handleLike(item)}
        navigation={navigation}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>❤️</Text>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyText}>
        You haven't saved any rooms yet. Tap the heart icon on posts you like to save them here!
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
      >
        <Ionicons name="search" size={20} color="white" />
        <Text style={styles.browseButtonText}>Browse Rooms</Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={styles.headerRight}>
            <Text style={styles.countText}>{favoritePosts.length} saved</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : (
        <FlatList
          data={favoritePosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
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
    width: 60,
  },
  countText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Extra padding for gesture bar
    flexGrow: 1,
  },
  postWrapper: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
