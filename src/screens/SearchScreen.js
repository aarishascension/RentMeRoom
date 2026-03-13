import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard from '../components/PostCard';
import { auth } from '../lib/firebase';
import { listenFavorites, listenPosts, mapPostForUI, toggleFavorite } from '../services/posts';

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const unsub = listenPosts((items) => setPosts(items));
    const uid = auth.currentUser?.uid;
    const unsubFav = uid ? listenFavorites(uid, setFavorites) : () => {};
    return () => {
      unsub?.();
      unsubFav?.();
    };
  }, []);

  const filteredPosts = posts
    .map((p) => mapPostForUI({ id: p.id, ...p }, favorites))
    .filter((p) => {
      const matchesSearch = 
        !searchQuery ||
        p.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = 
        !locationFilter ||
        (p.location || '').toLowerCase().includes(locationFilter.toLowerCase());
      return matchesSearch && matchesLocation;
    });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F97316']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerTitle}>Search</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, budget, BHK..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            <Ionicons name="location-outline" size={20} color="#9333EA" />
            <TextInput
              style={styles.filterInput}
              placeholder="All Locations"
              placeholderTextColor="#9CA3AF"
              value={locationFilter}
              onChangeText={setLocationFilter}
            />
          </View>
        </View>

        {searchQuery || locationFilter ? (
          <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
            <Text style={styles.resultsTitle}>Results ({filteredPosts.length})</Text>
            {filteredPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try adjusting your search</Text>
              </View>
            ) : (
              filteredPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onPress={() => navigation.navigate('PostDetail', { post: p.raw || p })}
                  onLike={() => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) return;
                    toggleFavorite(uid, p.id, p.likedByUser);
                  }}
                  navigation={navigation}
                />
              ))
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptySearch}>
            <Ionicons name="search-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptySearchTitle}>Start searching</Text>
            <Text style={styles.emptySearchText}>
              Search by location, budget, or room type
            </Text>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 120, // Tab bar height + extra spacing for gesture bar
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
