import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PostCard from '../components/PostCard';
import { auth } from '../lib/firebase';
import { deleteAllUserPosts, deletePost, listenFavorites, listenPosts, mapPostForUI, toggleFavorite } from '../services/posts';

export default function MyPostsScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Listen to favorites
    const unsubFavorites = listenFavorites(uid, (favIds) => {
      setFavorites(favIds);
    });

    // Listen to posts
    const unsubPosts = listenPosts((allPosts) => {
      // Filter posts by current user
      const userPosts = allPosts.filter(
        post => post.userId === uid
      );
      
      // Map posts for UI display with current favorites
      const mappedPosts = userPosts.map(post => mapPostForUI(post, favorites));
      
      setPosts(mappedPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      unsubPosts?.();
      unsubFavorites?.();
    };
  }, [favorites]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  const handleLike = async (post) => {
    try {
      await toggleFavorite(auth.currentUser?.uid, post.raw?.id || post.id, !post.likedByUser);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleDeletePost = (postId, postTitle) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${postTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllPosts = () => {
    if (posts.length === 0) {
      Alert.alert('No Posts', 'You have no posts to delete.');
      return;
    }

    Alert.alert(
      'Delete All Posts',
      `Are you sure you want to delete all ${posts.length} posts? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deletedCount = await deleteAllUserPosts();
              Alert.alert(
                'Success', 
                `Successfully deleted ${deletedCount} posts.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Delete all posts error:', error);
              Alert.alert('Error', error.message || 'Failed to delete posts');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderPost = ({ item }) => (
    <View style={styles.postWrapper}>
      <PostCard
        post={item}
        onPress={() => handlePostPress(item)}
        onLike={() => handleLike(item)}
        navigation={navigation}
      />
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePost(item.raw?.id || item.id, item.title || item.description)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptyText}>
        You haven't created any posts yet. Start by creating your first room listing!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          // Navigate back to Main tabs and switch to CreatePost tab
          navigation.getParent()?.navigate('CreatePost');
        }}
      >
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.createButtonText}>Create Post</Text>
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
          <Text style={styles.headerTitle}>My Posts</Text>
          <View style={styles.headerRight}>
            {posts.length > 0 && (
              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={handleDeleteAllPosts}
              >
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.deleteAllText}>Delete All</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.countText}>{posts.length} posts</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Loading your posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
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
    width: 80,
    alignItems: 'flex-end',
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    gap: 4,
  },
  deleteAllText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 4,
  },
  deleteText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
