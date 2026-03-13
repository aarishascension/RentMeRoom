// ====================
// src/screens/PostDetailScreen.js
// ====================
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationPicker from '../components/LocationPicker';
import { auth, db } from '../lib/firebase';
import { createOrGetChat } from '../services/messages';
import { addReply, listenReplies, toggleFavorite } from '../services/posts';

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [liked, setLiked] = useState(post?.likedByUser || false);
  const [likes, setLikes] = useState(post?.likes || 0);

  // Sync like state when post data changes
  useEffect(() => {
    if (post) {
      setLiked(post.likedByUser || false);
      setLikes(post.likes || 0);
    }
  }, [post?.likedByUser, post?.likes]);

  // Initialize like state from favorites if not available in post
  useEffect(() => {
    const initializeLikeState = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (uid && post?.id && (post?.likedByUser === undefined || post?.likes === undefined)) {
          // Check if this post is in user's favorites
          const favRef = collection(db, 'users', uid, 'favorites');
          const snapshot = await getDocs(favRef);
          const favoriteIds = new Set(snapshot.docs.map(doc => doc.id));
          
          const isLiked = favoriteIds.has(post.id);
          setLiked(isLiked);
          setLikes(isLiked ? 1 : 0);
        }
      } catch (error) {
        console.error('Error initializing like state:', error);
      }
    };

    initializeLikeState();
  }, [post?.id]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyImages, setReplyImages] = useState([]); // Multiple images
  const [replyLocation, setReplyLocation] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [replies, setReplies] = useState([]);
  const [posting, setPosting] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isOwnPost = auth.currentUser?.uid === (post?.raw?.userId || post?.userId);

  const handleEditPost = () => {
    // Navigate to Main tab navigator, then to CreatePost tab with params
    navigation.navigate('Main', {
      screen: 'CreatePost',
      params: {
        editMode: true,
        postData: {
          id: post?.id,
          title: post?.title || post?.question || '',
          description: post?.description || '',
          location: post?.location || '',
          price: post?.price || '',
          images: post?.raw?.images || post?.images || []
        }
      }
    });
  };

  useEffect(() => {
    if (post?.id) {
      const unsubscribe = listenReplies(post.id, setReplies);
      return () => unsubscribe();
    }
  }, [post?.id]);

  const handleLike = async () => {
    console.log('🔥 Like button pressed');
    console.log('🔥 Current liked state:', liked);
    console.log('🔥 Current likes count:', likes);
    console.log('🔥 Post ID:', post?.id);
    
    try {
      const uid = auth.currentUser?.uid;
      console.log('🔥 Current user ID:', uid);
      
      if (!uid) {
        console.log('🔥 No user logged in');
        Alert.alert('Login Required', 'Please log in to like posts');
        return;
      }

      // Update local state immediately for better UX
      const newLikedState = !liked;
      console.log('🔥 New liked state will be:', newLikedState);
      
      setLiked(newLikedState);
      setLikes(newLikedState ? likes + 1 : likes - 1);

      // Update backend
      console.log('🔥 Calling toggleFavorite with:', { uid, postId: post.id, currentLiked: liked });
      await toggleFavorite(uid, post.id, liked);
      console.log('🔥 toggleFavorite completed successfully');
    } catch (error) {
      console.error('🔥 Error toggling like:', error);
      // Revert local state on error
      setLiked(liked);
      setLikes(likes);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const pickReplyImage = async () => {
    console.log('📸 Add Photos button pressed, current images:', replyImages.length);
    
    if (replyImages.length >= 3) {
      Alert.alert('Limit reached', 'You can add up to 3 photos in replies.');
      return;
    }

    try {
      console.log('📸 Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos.');
        return;
      }

      console.log('📸 Opening image picker...');
      // Try multiple selection first, fallback to single if not supported
      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: false,
          allowsMultipleSelection: true,
          selectionLimit: 3 - replyImages.length,
        });
      } catch (multipleError) {
        console.log('📸 Multiple selection not supported, using single selection');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: false,
        });
      }

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        console.log('📸 New images selected:', newImages);
        
        setReplyImages(prev => {
          const updated = [...prev, ...newImages];
          console.log('📸 Updated reply images:', updated);
          return updated;
        });
        
        // Keep single image for backward compatibility
        if (!replyImage) {
          setReplyImage(newImages[0]);
        }
        
        console.log('📸 Reply images selected:', newImages.length, 'Total will be:', replyImages.length + newImages.length);
      } else {
        console.log('📸 Image picker was canceled or no assets');
      }
    } catch (error) {
      console.error('📸 Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removeReplyImage = (index) => {
    setReplyImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update single image reference
      if (index === 0) {
        setReplyImage(newImages[0] || null);
      }
      return newImages;
    });
  };

  const openImageViewer = (images, startIndex = 0) => {
    setSelectedImages(images);
    setSelectedImageIndex(startIndex);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setSelectedImages([]);
    setSelectedImageIndex(0);
  };

  const openLocationInMaps = (locationText) => {
    const encodedLocation = encodeURIComponent(locationText);
    const mapsUrl = Platform.OS === 'ios' 
      ? `maps://app?q=${encodedLocation}`
      : `geo:0,0?q=${encodedLocation}`;
    
    Linking.canOpenURL(mapsUrl).then(supported => {
      if (supported) {
        Linking.openURL(mapsUrl);
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        Linking.openURL(googleMapsUrl);
      }
    }).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const renderReplyText = (text) => {
    // Check if text contains location (📍 emoji)
    const locationMatch = text.match(/📍\s*(.+)$/m);
    
    if (locationMatch) {
      const [fullMatch, locationText] = locationMatch;
      const textBeforeLocation = text.replace(fullMatch, '').trim();
      
      return (
        <View>
          {textBeforeLocation && (
            <Text style={styles.replyText}>{textBeforeLocation}</Text>
          )}
          <TouchableOpacity 
            style={styles.replyLocationContainer}
            onPress={() => openLocationInMaps(locationText.trim())}
          >
            <Ionicons name="location" size={14} color="#9333EA" />
            <Text style={styles.replyLocationText}>{locationText.trim()}</Text>
            <Ionicons name="open-outline" size={12} color="#9333EA" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      );
    }
    
    return <Text style={styles.replyText}>{text}</Text>;
  };



  const handlePostReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Empty reply', 'Please write something');
      return;
    }
    
    setPosting(true);
    try {
      await addReply(post.id, {
        text: replyText + (replyLocation ? `\n📍 ${replyLocation}` : ''),
        imageUri: replyImage, // Keep for backward compatibility
        images: replyImages, // Multiple images
      });
      
      Alert.alert('Success', 'Reply posted!');
      setReplyText('');
      setReplyImage(null);
      setReplyImages([]);
      setReplyLocation('');
      setShowReplyModal(false);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <TouchableOpacity 
                style={styles.avatar}
                onPress={async () => {
                  try {
                    const userId = post?.raw?.userId || post?.userId;
                    const userName = post?.user?.name || post?.raw?.userName || 'User';
                    
                    if (userId && userId !== auth.currentUser?.uid) {
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
                <Text style={styles.avatarText}>
                  {post?.user?.avatar || 'U'}
                </Text>
              </TouchableOpacity>
              <View>
                <View style={styles.userNameRow}>
                  <TouchableOpacity 
                    onPress={async () => {
                      try {
                        const userId = post?.raw?.userId || post?.userId;
                        const userName = post?.user?.name || post?.raw?.userName || 'User';
                        
                        if (userId && userId !== auth.currentUser?.uid) {
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
                    <Text style={[styles.userName, styles.tappableUserName]}>
                      {post?.user?.name || 'User'}
                    </Text>
                  </TouchableOpacity>
                  {post?.user?.verified && (
                    <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                  )}
                  {post?.user?.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{post.user.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.time}>{post?.time || 'Just now'}</Text>
              </View>
            </View>
            {isOwnPost && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditPost}
              >
                <Ionicons name="create-outline" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Multiple Images Display */}
          {(post?.raw?.images && post.raw.images.length > 0) || (post?.images && post.images.length > 0) ? (
            <View style={styles.imagesContainer}>
              {(() => {
                const images = post?.raw?.images || post?.images || [];
                return images.length === 1 ? (
                  // Single image - display normally
                  <TouchableOpacity onPress={() => openImageViewer(images, 0)}>
                    <Image 
                      source={{ uri: images[0] }} 
                      style={styles.hero} 
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  // Multiple images - use horizontal scroll with proper sizing
                  <>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.multipleImagesScroll}
                      contentContainerStyle={styles.multipleImagesContent}
                      pagingEnabled={false}
                      decelerationRate="fast"
                      snapToInterval={screenWidth - 48} // Account for margins
                      snapToAlignment="start"
                    >
                      {images.map((imageUrl, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.multipleImageContainer}
                          onPress={() => openImageViewer(images, index)}
                        >
                          <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.multipleImage} 
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity 
                      style={styles.imageIndicator}
                      onPress={() => openImageViewer(images, 0)}
                    >
                      <Text style={styles.imageCounter}>
                        {images.length} photos
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          ) : (post?.raw?.imageUrl || post?.imageUrl) ? (
            <TouchableOpacity onPress={() => openImageViewer([post?.raw?.imageUrl || post?.imageUrl], 0)}>
              <Image source={{ uri: post?.raw?.imageUrl || post?.imageUrl }} style={styles.hero} resizeMode="cover" />
            </TouchableOpacity>
          ) : null}
          {/* Single content field - show title if exists, otherwise description or question */}
          <Text style={styles.question}>
            {post?.title || post?.question || 'No content'}
          </Text>
          
          {/* Show description separately if it exists and is different from title */}
          {post?.description && post?.description !== post?.title && post?.description !== post?.question && (
            <Text style={styles.description}>
              {post?.description}
            </Text>
          )}
          
          {(post?.location || post?.raw?.location) && (
            <TouchableOpacity 
              style={styles.locationRow}
              onPress={() => {
                const location = post?.location || post?.raw?.location;
                const encodedLocation = encodeURIComponent(location);
                const mapsUrl = Platform.OS === 'ios' 
                  ? `maps://app?q=${encodedLocation}`
                  : `geo:0,0?q=${encodedLocation}`;
                
                Linking.canOpenURL(mapsUrl).then(supported => {
                  if (supported) {
                    Linking.openURL(mapsUrl);
                  } else {
                    // Fallback to Google Maps web
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
                    Linking.openURL(googleMapsUrl);
                  }
                }).catch(err => {
                  console.error('Error opening maps:', err);
                  Alert.alert('Error', 'Could not open maps');
                });
              }}
            >
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.location}>{post?.location || post?.raw?.location}</Text>
              <Ionicons name="open-outline" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          {(post?.price || post?.raw?.price) && (
            <View style={styles.priceRow}>
              <Ionicons name="cash" size={16} color="#10B981" />
              <Text style={styles.priceText}>{post?.price || post?.raw?.price}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                console.log('🔥 LIKE BUTTON TOUCHED!');
                handleLike();
              }}
            >
              <Ionicons 
                name={liked ? 'heart' : 'heart-outline'} 
                size={24} 
                color={liked ? '#EF4444' : '#6B7280'} 
              />
              <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
                {likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowReplyModal(true)}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
              <Text style={styles.actionText}>{replies.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                try {
                  const title = post?.title || 'Property Listing';
                  const location = post?.location || 'Location not specified';
                  const price = post?.price ? `₹${post?.price}` : 'Contact for price';
                  const description = post?.description || '';
                  
                  const shareContent = `${title}\n\n📍 ${location}\n💰 ${price}\n\n${description}\n\nFind more properties on RentMeRoom App!`;
                  
                  const result = await Share.share({
                    message: shareContent,
                    title: title,
                  });

                  if (result.action === Share.sharedAction) {
                    if (result.activityType) {
                      // Shared with activity type of result.activityType
                      console.log('Shared via:', result.activityType);
                    } else {
                      // Shared
                      console.log('Content shared successfully');
                    }
                  } else if (result.action === Share.dismissedAction) {
                    // Dismissed
                    console.log('Share dismissed');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to share property');
                  console.error('Share error:', error);
                }
              }}
            >
              <Ionicons name="share-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Message Owner Button */}
          {(post?.raw?.userId || post?.userId) && (
            <TouchableOpacity
              style={styles.messageOwnerButton}
              onPress={async () => {
                try {
                  const userId = post?.raw?.userId || post?.userId;
                  const userName = post?.user?.name || post?.raw?.userName || 'User';
                  const chatId = await createOrGetChat(userId, userName);
                  navigation.navigate('ChatDetail', {
                    chatId,
                    title: userName,
                    otherUserId: userId,
                  });
                } catch (error) {
                  Alert.alert('Error', 'Failed to start chat');
                }
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="white" />
              <Text style={styles.messageOwnerText}>Message Owner</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.repliesSection}>
          <Text style={styles.repliesTitle}>Responses ({replies.length})</Text>
          {replies.length === 0 ? (
            <View style={styles.emptyReplies}>
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No responses yet</Text>
              <Text style={styles.emptySubtext}>Be the first to help!</Text>
            </View>
          ) : (
            replies.map((reply) => (
              <View key={reply.id} style={styles.replyCard}>
                <View style={styles.replyHeader}>
                  <TouchableOpacity 
                    style={styles.replyAvatar}
                    onPress={async () => {
                      try {
                        if (reply.userId && reply.userId !== auth.currentUser?.uid) {
                          const chatId = await createOrGetChat(
                            reply.userId,
                            reply.userName || 'User'
                          );
                          navigation.navigate('ChatDetail', {
                            chatId,
                            title: reply.userName || 'User',
                            otherUserId: reply.userId,
                          });
                        }
                      } catch (error) {
                        console.error('Error navigating to chat:', error);
                        Alert.alert('Error', 'Could not start chat');
                      }
                    }}
                  >
                    <Text style={styles.replyAvatarText}>
                      {reply.userName?.substring(0, 2).toUpperCase() || 'U'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.replyUserInfo}>
                    <TouchableOpacity 
                      onPress={async () => {
                        try {
                          if (reply.userId && reply.userId !== auth.currentUser?.uid) {
                            const chatId = await createOrGetChat(
                              reply.userId,
                              reply.userName || 'User'
                            );
                            navigation.navigate('ChatDetail', {
                              chatId,
                              title: reply.userName || 'User',
                              otherUserId: reply.userId,
                            });
                          }
                        } catch (error) {
                          console.error('Error navigating to chat:', error);
                          Alert.alert('Error', 'Could not start chat');
                        }
                      }}
                    >
                      <Text style={[styles.replyUserName, styles.tappableUserName]}>
                        {reply.userName || 'User'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.replyTime}>Just now</Text>
                  </View>
                </View>
                {renderReplyText(reply.text)}
                
                {/* Multiple Images Display for Replies */}
                {reply.images && reply.images.length > 0 ? (
                  <View style={styles.replyImagesDisplayContainer}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.replyImagesDisplayScroll}
                      contentContainerStyle={styles.replyImagesDisplayContent}
                    >
                      {reply.images.map((imageUrl, index) => (
                        <TouchableOpacity 
                          key={index}
                          onPress={() => openImageViewer(reply.images, index)}
                        >
                          <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.replyImageDisplay} 
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {reply.images.length > 1 && (
                      <TouchableOpacity 
                        style={styles.replyImageIndicator}
                        onPress={() => openImageViewer(reply.images, 0)}
                      >
                        <Text style={styles.replyImageCounter}>
                          {reply.images.length} photos
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : reply.imageUrl ? (
                  <TouchableOpacity onPress={() => openImageViewer([reply.imageUrl], 0)}>
                    <Image source={{ uri: reply.imageUrl }} style={styles.replyImageDisplay} resizeMode="cover" />
                  </TouchableOpacity>
                ) : null}
                <View style={styles.replyActionsRow}>
                  {reply.userPhone && (
                    <TouchableOpacity 
                      style={styles.replyActionBtn}
                      onPress={() => {
                        Linking.openURL(`tel:${reply.userPhone}`);
                      }}
                    >
                      <Ionicons name="call" size={16} color="white" />
                      <Text style={styles.replyActionBtnText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {reply.userId && (
                    <TouchableOpacity 
                      style={[styles.replyActionBtn, styles.replyActionBtnMessage]}
                      onPress={async () => {
                        try {
                          const chatId = await createOrGetChat(
                            reply.userId,
                            reply.userName || 'User'
                          );
                          navigation.navigate('ChatDetail', {
                            chatId,
                            title: reply.userName || 'User',
                            otherUserId: reply.userId,
                          });
                        } catch (error) {
                          Alert.alert('Error', 'Failed to start chat');
                        }
                      }}
                    >
                      <Ionicons name="chatbubble" size={16} color="white" />
                      <Text style={styles.replyActionBtnText}>Message</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Reply Button */}
      {!showReplyModal && (
        <View style={[styles.replyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setShowReplyModal(true)}
          >
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.replyButtonText}>Post Reply</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reply Modal */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReplyModal(false)}
        statusBarTranslucent={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Reply</Text>
              <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.replyInput}
              placeholder="Share property details, contact info, location..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              value={replyText}
              onChangeText={setReplyText}
              textAlignVertical="top"
            />

            <View style={styles.replyActions}>
              <TouchableOpacity
                style={[styles.replyActionButton, replyImages.length > 0 && styles.replyActionButtonActive]}
                onPress={pickReplyImage}
              >
                <Ionicons name="camera-outline" size={20} color={replyImages.length > 0 ? '#9333EA' : '#6B7280'} />
                <Text style={[styles.replyActionText, replyImages.length > 0 && styles.replyActionTextActive]}>
                  {replyImages.length === 0 ? 'Add Photos' : 
                   replyImages.length >= 3 ? 'Max 3 Photos' : 
                   `Add More (${replyImages.length}/3)`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.replyActionButton, replyLocation && styles.replyActionButtonActive]}
                onPress={() => setShowLocationPicker(true)}
              >
                <Ionicons name="location-outline" size={20} color={replyLocation ? '#9333EA' : '#6B7280'} />
                <Text style={[styles.replyActionText, replyLocation && styles.replyActionTextActive]}>
                  {replyLocation ? 'Location Set' : 'Add Location'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Multiple Images Preview */}
            {replyImages.length > 0 && (
              <View style={styles.replyImagesContainer}>
                <View style={styles.replyImagesHeader}>
                  <Text style={styles.replyImagesTitle}>Photos ({replyImages.length}/3)</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Clear All Photos',
                        'Remove all selected photos?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Clear All', 
                            style: 'destructive',
                            onPress: () => {
                              setReplyImages([]);
                              setReplyImage(null);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.replyImagesScroll}
                  contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                  {replyImages.map((imageUri, index) => (
                    <View key={index} style={styles.replyImageItem}>
                      <Image 
                        source={{ uri: imageUri }} 
                        style={styles.replyImagePreview} 
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeReplyImageButton}
                        onPress={() => removeReplyImage(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Location Display */}
            {replyLocation && (
              <View style={styles.replyLocationDisplay}>
                <Ionicons name="location" size={16} color="#9333EA" />
                <Text style={styles.replyLocationText}>{replyLocation}</Text>
                <TouchableOpacity
                  onPress={() => setReplyLocation('')}
                  style={styles.removeLocationButton}
                >
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.postReplyButton, (!replyText.trim() || posting) && styles.postReplyButtonDisabled]}
              onPress={handlePostReply}
              disabled={!replyText.trim() || posting}
            >
              <Text style={styles.postReplyButtonText}>
                {posting ? 'Posting...' : 'Post Reply'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={(location) => {
          setReplyLocation(location);
          setShowLocationPicker(false);
        }}
        initialLocation={replyLocation}
      />

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
        statusBarTranslucent={true}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {selectedImages.length > 1 && (
            <View style={styles.imageViewerCounter}>
              <Text style={styles.imageViewerCounterText}>
                {selectedImageIndex + 1} / {selectedImages.length}
              </Text>
            </View>
          )}

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
            contentOffset={{ x: selectedImageIndex * screenWidth, y: 0 }}
          >
            {selectedImages.map((imageUrl, index) => (
              <View key={index} style={styles.imageViewerImageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {selectedImages.length > 1 && (
            <View style={styles.imageViewerDots}>
              {selectedImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageViewerDot,
                    index === selectedImageIndex && styles.imageViewerDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Add extra padding for reply button
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tappableUserName: {
    color: '#8B5CF6',
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9333EA',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  description: { 
    fontSize: 14, 
    color: '#1F2937', 
    backgroundColor: '#E0E7FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12, 
    lineHeight: 20 
  },
  hero: { 
    width: '100%', 
    height: 220, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  imagesContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  multipleImagesScroll: {
    borderRadius: 12,
    height: 220,
  },
  multipleImagesContent: {
    paddingRight: 16,
  },
  multipleImageContainer: {
    width: screenWidth - 48, // Account for card padding (16px each side) + margin
    marginRight: 12,
  },
  multipleImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  location: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  priceText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 24,
    marginBottom: 16,
  },
  messageOwnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  messageOwnerText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    minWidth: 50,
    minHeight: 40,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionTextLiked: {
    color: '#EF4444',
  },
  repliesSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  replyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  replyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  replyUserInfo: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  replyTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  replyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  replyLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  replyLocationText: {
    fontSize: 13,
    color: '#7C3AED',
    marginLeft: 4,
    fontWeight: '500',
  },
  replyImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  replyImagesDisplayContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  replyImagesDisplayScroll: {
    borderRadius: 8,
    height: 160,
  },
  replyImagesDisplayContent: {
    paddingRight: 8,
  },
  replyImageDisplay: {
    width: 200,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  replyImageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  replyImageCounter: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  replyActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  replyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  replyActionBtnMessage: {
    backgroundColor: '#8B5CF6',
  },
  replyActionBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  replyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    zIndex: 100,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333EA',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  replyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  replyInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    marginBottom: 16,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  replyActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  replyActionButtonActive: {
    backgroundColor: '#F3E8FF',
  },
  replyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  replyActionTextActive: {
    color: '#9333EA',
  },
  replyImagesContainer: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
  },
  replyImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  replyImagesScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  replyImageItem: {
    position: 'relative',
    marginRight: 8,
  },
  replyImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  removeReplyImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  replyLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  replyLocationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#7C3AED',
  },
  removeLocationButton: {
    padding: 4,
  },
  replyLocationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  replyLocationIcon: {
    marginRight: 8,
  },
  replyLocationInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  replyImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  postReplyButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postReplyButtonDisabled: {
    opacity: 0.5,
  },
  postReplyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Image Viewer Modal Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageViewerCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageViewerCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerImageContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: screenWidth,
    height: '80%',
  },
  imageViewerDots: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  imageViewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  imageViewerDotActive: {
    backgroundColor: 'white',
  },
});

