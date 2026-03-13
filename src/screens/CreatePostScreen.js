// ====================
// src/screens/CreatePostScreen.js
// ====================
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LocationPicker from '../components/LocationPicker';
import { autoCompressImage, validateImage } from '../services/imageUtils';
import { getUserCountry } from '../services/location';
import { useOfflineAware } from '../services/offline';
import { createPost, updatePost } from '../services/posts';

export default function CreatePostScreen({ navigation, route }) {
  const editMode = route?.params?.editMode || false;
  const existingPost = route?.params?.postData || null;
  
  const [postText, setPostText] = useState(existingPost?.title || '');
  const [description, setDescription] = useState(existingPost?.description || '');
  const [location, setLocation] = useState(existingPost?.location || '');
  const [locationCoords, setLocationCoords] = useState(null);
  const [country, setCountry] = useState('IN');
  const [price, setPrice] = useState(existingPost?.price || '');
  const [images, setImages] = useState(existingPost?.images || []);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const { isConnected, executeOrQueue } = useOfflineAware();

  // Auto-detect country on mount (silent, no UI)
  useEffect(() => {
    getUserCountry().then(detectedCountry => {
      setCountry(detectedCountry);
      console.log('Auto-detected country for post:', detectedCountry);
    });
  }, []);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 photos maximum.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to upload images.');
        return;
      }

      const remainingSlots = 5 - images.length;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1.0, // Use full quality, we'll compress it ourselves
        allowsEditing: false, // Disable editing for multiple selection
        allowsMultipleSelection: true, // Enable multiple selection
        selectionLimit: remainingSlots, // Limit to remaining slots
      });
      
      if (!res.canceled && res.assets && res.assets.length > 0) {
        try {
          setCompressing(true);
          
          const compressedImages = [];
          
          // Process each selected image
          for (let i = 0; i < res.assets.length; i++) {
            const selectedUri = res.assets[i].uri;
            
            try {
              // Validate image
              await validateImage(selectedUri);
              
              // Compress image
              const compressedUri = await autoCompressImage(selectedUri);
              compressedImages.push(compressedUri);
            } catch (error) {
              console.error(`Error processing image ${i + 1}:`, error);
              Alert.alert('Warning', `Failed to process image ${i + 1}. Skipping...`);
            }
          }
          
          if (compressedImages.length > 0) {
            // Add all compressed images to the array
            setImages(prev => [...prev, ...compressedImages]);
            
            const totalImages = images.length + compressedImages.length;
            Alert.alert(
              'Success', 
              `${compressedImages.length} photo${compressedImages.length > 1 ? 's' : ''} added! Total: ${totalImages}/5`
            );
          }
        } catch (error) {
          console.error('Image processing error:', error);
          Alert.alert('Error', error.message || 'Failed to process images');
        } finally {
          setCompressing(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
      setCompressing(false);
    }
  };



  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Missing info', 'Please write something');
      return;
    }
    
    setLoading(true);
    
    const postData = {
      title: postText.substring(0, 100), // First 100 chars as title
      description: description || postText, // Use description if provided, otherwise use postText
      location,
      country, // Add country
      price: price || 'Price not specified',
      type: 'offering',
      imageUri: images[0] || null, // Use first image for backward compatibility
      images: images, // Include all images
    };
    
    console.log('📤 CreatePost - Sending data:', {
      hasImages: !!images.length,
      imagesCount: images.length,
      firstImage: images[0],
      allImages: images
    });
    
    try {
      if (isConnected) {
        if (editMode && existingPost?.id) {
          await updatePost(existingPost.id, postData);
          Alert.alert('Success', 'Post updated successfully!');
        } else {
          await createPost(postData);
          Alert.alert('Success', 'Post created successfully!');
        }
      } else {
        await executeOrQueue('CREATE_POST', postData, createPost);
        Alert.alert('Offline', 'Post queued and will be uploaded when you\'re back online.');
      }
      
      // Clear form
      setPostText('');
      setDescription(''); // Clear description
      setLocation('');
      setLocationCoords(null);
      setPrice(''); // Clear price
      setImages([]); // Clear images array
      
      // Navigate back
      if (editMode) {
        // Go back to previous screen (PostDetail) which will refresh
        navigation.goBack();
      } else {
        // Navigate to home tab for new posts
        navigation.navigate('Main', { screen: 'HomeTab' });
      }
    } catch (e) {
      Alert.alert('Post error', e?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (address, coordinates) => {
    setLocation(address);
    setLocationCoords(coordinates);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F97316']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{editMode ? 'Edit Post' : 'New Request'}</Text>
            <View style={styles.connectionStatus}>
              <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.connectionText}>{isConnected ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handlePost}
            disabled={!postText.trim() || loading || compressing}
          >
            <Text style={[styles.postText, (!postText.trim() || loading || compressing) && styles.postTextDisabled]}>
              {loading ? (editMode ? 'Updating...' : 'Posting...') : (editMode ? 'Update' : 'Post')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
            <TextInput
              style={styles.postInput}
              placeholder="Title (e.g., '2BHK near Andheri')"
              placeholderTextColor="#9CA3AF"
              multiline
              value={postText}
              onChangeText={setPostText}
              textAlignVertical="top"
              autoFocus
            />
          </View>

          <View style={styles.descriptionContainer}>
            <Ionicons name="document-text-outline" size={20} color="#9333EA" />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (e.g., 'Spacious 2BHK with parking, near metro station...')"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color="#9333EA" />
            <TextInput
              style={styles.locationInput}
              placeholder="Location (e.g., Andheri, Mumbai)"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.locationInputContainer}>
            <Ionicons name="cash-outline" size={20} color="#9333EA" />
            <TextInput
              style={styles.locationInput}
              placeholder="Price (e.g., ₹25,000/month)"
              placeholderTextColor="#9CA3AF"
              value={price}
              onChangeText={setPrice}
              keyboardType="default"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, compressing && styles.actionButtonDisabled]} 
              onPress={pickImage}
              disabled={compressing || images.length >= 5}
            >
              <Ionicons name="images-outline" size={20} color="#9333EA" />
              <Text style={styles.actionButtonText}>
                {compressing ? 'Processing...' : 
                 images.length === 0 ? 'Select Photos' :
                 images.length >= 5 ? 'Max 5 Photos' :
                 `Add More (${images.length}/5)`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="location-outline" size={20} color="#9333EA" />
              <Text style={styles.actionButtonText}>
                {location || "Select Location"}
              </Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.photoActions}>
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={() => {
                  Alert.alert(
                    'Clear All Photos',
                    'Are you sure you want to remove all photos?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear All', style: 'destructive', onPress: () => setImages([]) }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              <View style={styles.imagesHeader}>
                <Text style={styles.imagesTitle}>Photos ({images.length}/5)</Text>
                <Text style={styles.imagesHint}>Use arrows to reorder • Tap X to remove</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    
                    {/* Remove button */}
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                    
                    {/* Photo number */}
                    <View style={styles.imageNumber}>
                      <Text style={styles.imageNumberText}>{index + 1}</Text>
                    </View>
                    
                    {/* Reorder controls */}
                    {images.length > 1 && (
                      <View style={styles.reorderControls}>
                        {index > 0 && (
                          <TouchableOpacity
                            style={styles.reorderButton}
                            onPress={() => moveImage(index, index - 1)}
                          >
                            <Ionicons name="chevron-up" size={16} color="white" />
                          </TouchableOpacity>
                        )}
                        {index < images.length - 1 && (
                          <TouchableOpacity
                            style={[styles.reorderButton, { marginTop: 2 }]}
                            onPress={() => moveImage(index, index + 1)}
                          >
                            <Ionicons name="chevron-down" size={16} color="white" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={location}
      />
    </KeyboardAvoidingView>
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
  cancelText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  postText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  postTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding for gesture bar
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  countrySelectorText: {
    fontSize: 16,
    color: '#111827',
  },
  countryPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    maxHeight: 200,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryOptionSelected: {
    backgroundColor: '#F3E8FF',
  },
  countryOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginLeft: 8,
    flex: 1,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  imagesContainer: {
    marginTop: 16,
  },
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  imagesHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reorderControls: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'column',
  },
  reorderButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    width: 20,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

