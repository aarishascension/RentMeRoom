// ===================================
// FILE: src/components/PostCard.js
// ===================================
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../lib/firebase';
import { createOrGetChat } from '../services/messages';
import ReportModal from './SimpleReportModal';

export default function PostCard({ post, onPress, onLike, navigation }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const currentUserId = auth.currentUser?.uid;
  const isOwnPost = currentUserId === post.raw?.userId;
  
  // Safety check for post and user data
  if (!post || !post.user) {
    return null;
  }
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.avatar}
          onPress={async () => {
            try {
              const userId = post.raw?.userId;
              const userName = post.user?.name || 'User';
              
              if (userId && userId !== auth.currentUser?.uid && navigation) {
                const chatId = await createOrGetChat(userId, userName);
                navigation.navigate('ChatDetail', {
                  chatId,
                  title: userName,
                  otherUserId: userId,
                });
              }
            } catch (error) {
              console.error('Error navigating to chat:', error);
              Alert.alert('Error', 'Could not start chat');
            }
          }}
        >
          <Text style={styles.avatarText}>{post.user?.avatar || '👤'}</Text>
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  const userId = post.raw?.userId;
                  const userName = post.user?.name || 'User';
                  
                  if (userId && userId !== auth.currentUser?.uid && navigation) {
                    const chatId = await createOrGetChat(userId, userName);
                    navigation.navigate('ChatDetail', {
                      chatId,
                      title: userName,
                      otherUserId: userId,
                    });
                  }
                } catch (error) {
                  console.error('Error navigating to chat:', error);
                  Alert.alert('Error', 'Could not start chat');
                }
              }}
            >
              <Text style={[styles.name, styles.tappableName]}>
                {post.user?.name || 'Unknown User'}
              </Text>
            </TouchableOpacity>
            {post.user?.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
            )}
          </View>
          <Text style={styles.time}>{post.time}</Text>
        </View>
        {!isOwnPost && (
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              console.log('🐛 PostCard three-dots pressed:', {
                postId: post.id,
                userId: post.raw?.userId,
                userName: post.user?.name
              });
              setShowReportModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.question}>
        {post.question}
      </Text>

      {/* Image Display */}
      {(post.raw?.images && post.raw.images.length > 0) ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: post.raw.images[0] }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
          {post.raw.images.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageCounter}>
                +{post.raw.images.length - 1}
              </Text>
            </View>
          )}
        </View>
      ) : post.raw?.imageUrl ? (
        <Image 
          source={{ uri: post.raw.imageUrl }} 
          style={styles.postImage} 
          resizeMode="cover"
        />
      ) : null}

      {/* Description - show if different from question/title */}
      {post.raw?.description && post.raw?.title && post.raw.description !== post.raw.title && (
        <View style={styles.descriptionTag}>
          <Ionicons name="document-text" size={14} color="#6366F1" />
          <Text style={styles.descriptionText}>
            {post.raw.description}
          </Text>
        </View>
      )}

      {post.location && (
        <View style={styles.location}>
          <Ionicons name="location" size={14} color="#9333EA" />
          <Text style={styles.locationText}>{post.location}</Text>
        </View>
      )}

      {post.raw?.price && (
        <View style={styles.priceTag}>
          <Ionicons name="cash" size={14} color="#10B981" />
          <Text style={styles.priceText}>{post.raw.price}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.stat} onPress={onLike}>
          <Ionicons
            name={post.likedByUser ? 'heart' : 'heart-outline'}
            size={16}
            color={post.likedByUser ? '#EC4899' : '#6B7280'}
          />
          <Text style={styles.statText}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stat} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{post.replies}</Text>
        </TouchableOpacity>
      </View>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post.raw?.userId}
        targetName={post.user?.name || 'Unknown User'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 180,
  },
  header: { flexDirection: 'row', marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  userInfo: { marginLeft: 10, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  name: { fontWeight: '600', fontSize: 13, color: '#111827' },
  tappableName: {
    color: '#8B5CF6',
  },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  question: { fontSize: 13, color: '#1F2937', marginBottom: 10, lineHeight: 18 },
  descriptionTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
  },
  descriptionText: { 
    fontSize: 11, 
    color: '#1F2937', 
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  imageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounter: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  locationText: { fontSize: 11, color: '#9333EA', fontWeight: '600', marginLeft: 4 },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  priceText: { fontSize: 11, color: '#10B981', fontWeight: '600', marginLeft: 4 },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 16,
    marginTop: 'auto',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  moreButton: {
    padding: 4,
    borderRadius: 12,
  },
});
