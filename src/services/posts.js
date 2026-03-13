import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { geocodeLocation } from './geocoding';
import { autoCompressImage, validateImage } from './imageUtils';

const POSTS_COLLECTION = 'posts';

export const listenPosts = (cb) => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb(items);
      },
      (error) => {
        // Silently handle permission errors
        cb([]); // Return empty array on error
      }
    );
  } catch (error) {
    console.log('Failed to setup posts listener, using empty array');
    cb([]);
    return () => {}; // Return no-op unsubscribe
  }
};

export const listenFavorites = (userId, cb) => {
  if (!userId) {
    console.log('No userId provided for favorites listener');
    cb(new Set());
    return () => {};
  }
  
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.log('User not authenticated for favorites listener');
    cb(new Set());
    return () => {};
  }
  
  try {
    const favRef = collection(db, 'users', userId, 'favorites');
    return onSnapshot(
      favRef,
      (snap) => {
        const ids = new Set(snap.docs.map((d) => d.id));
        cb(ids);
      },
      (error) => {
        // Silently handle permission errors - just return empty set
        cb(new Set());
      }
    );
  } catch (error) {
    console.log('Failed to setup favorites listener, using empty set');
    cb(new Set());
    return () => {}; // Return no-op unsubscribe
  }
};

const uploadImageAsync = async (uri, userId) => {
  try {
    // Validate image first
    await validateImage(uri);
    
    // Compress image before upload
    const compressedUri = await autoCompressImage(uri);
    
    // Fetch the compressed image as a blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `posts/${userId}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const createPost = async ({ title, description, location, price, type, imageUri, images, country }) => {
  console.log('🔥 createPost - Received data:', {
    hasImageUri: !!imageUri,
    hasImages: !!images,
    imagesLength: images?.length,
    images: images,
    location: location
  });
  
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated. Please log in.');

    let imageUrl = null;
    let imageUrls = [];

    // Handle multiple images
    if (images && images.length > 0) {
      console.log('📸 Uploading multiple images:', images.length);
      try {
        const uploadPromises = images.map(imageUri => uploadImageAsync(imageUri, user.uid));
        imageUrls = await Promise.all(uploadPromises);
        imageUrl = imageUrls[0]; // Keep first image for backward compatibility
        console.log('✅ Multiple images uploaded:', imageUrls);
      } catch (uploadError) {
        console.error('Multiple images upload failed:', uploadError);
        throw new Error('Failed to upload images. Please try again.');
      }
    } else if (imageUri) {
      // Handle single image (backward compatibility)
      console.log('📸 Uploading single image');
      try {
        imageUrl = await uploadImageAsync(imageUri, user.uid);
        imageUrls = [imageUrl];
        console.log('✅ Single image uploaded:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('Failed to upload image. Please try again.');
      }
    }

    // Geocode location to get coordinates
    let coordinates = null;
    let formattedAddress = location?.trim() || '';
    
    if (location && location.trim()) {
      try {
        console.log('🌍 Geocoding location:', location);
        const geocodeResult = await geocodeLocation(location.trim());
        coordinates = {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        };
        formattedAddress = geocodeResult.formattedAddress;
        console.log('✅ Location geocoded:', coordinates);
      } catch (geocodeError) {
        console.warn('⚠️ Geocoding failed, saving without coordinates:', geocodeError.message);
        // Continue without coordinates - post will still be created
      }
    }

    const payload = {
      title: title?.trim() || '',
      description: description?.trim() || '',
      location: formattedAddress,
      coordinates: coordinates, // Add coordinates to post
      country: country || 'IN', // Add country field
      price: price?.trim() || '',
      type: type || 'offering',
      imageUrl, // First image for backward compatibility
      imageUrls, // Array of all images
      images: imageUrls, // Also store as 'images' for consistency with PostDetailScreen
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'User',
      createdAt: serverTimestamp(),
    };
    
    console.log('💾 Saving post with payload:', {
      hasImageUrl: !!payload.imageUrl,
      hasImageUrls: !!payload.imageUrls,
      imageUrlsLength: payload.imageUrls?.length,
      hasImages: !!payload.images,
      imagesLength: payload.images?.length,
      hasCoordinates: !!payload.coordinates,
      coordinates: payload.coordinates
    });

    await addDoc(collection(db, POSTS_COLLECTION), payload);
    console.log('✅ Post saved successfully with coordinates');
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
};

export const updatePost = async (postId, { title, description, location, price, type, imageUri, images, country }) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated. Please log in.');

    const postRef = doc(db, POSTS_COLLECTION, postId);
    
    // Geocode location if changed
    let coordinates = null;
    let formattedAddress = location?.trim() || '';
    
    if (location && location.trim()) {
      try {
        const geocodeResult = await geocodeLocation(location.trim());
        coordinates = {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        };
        formattedAddress = geocodeResult.formattedAddress;
      } catch (geocodeError) {
        console.warn('⚠️ Geocoding failed, updating without coordinates:', geocodeError.message);
      }
    }

    const updateData = {
      title: title?.trim() || '',
      description: description?.trim() || '',
      location: formattedAddress,
      coordinates: coordinates,
      country: country || 'IN',
      price: price?.trim() || '',
      type: type || 'offering',
      updatedAt: serverTimestamp(),
    };
    
    // Only update images if new ones provided
    if (images && images.length > 0) {
      updateData.images = images;
      updateData.imageUrls = images;
      updateData.imageUrl = images[0];
    }

    await updateDoc(postRef, updateData);
    console.log('✅ Post updated successfully');
  } catch (error) {
    console.error('Update post error:', error);
    throw error;
  }
};

export const toggleFavorite = async (userId, postId, isFav) => {
  try {
    if (!userId || !postId) {
      console.warn('Missing userId or postId for favorite toggle');
      return;
    }
    const favRef = doc(db, 'users', userId, 'favorites', postId);
    if (isFav) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, { createdAt: serverTimestamp() });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    // Don't throw - favorites are non-critical
  }
};

export const addReply = async (postId, replyData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated. Please log in.');

    let imageUrl = null;
    let imageUrls = [];

    // Handle multiple images
    if (replyData.images && replyData.images.length > 0) {
      try {
        const uploadPromises = replyData.images.map(async (imageUri) => {
          await validateImage(imageUri);
          const compressedUri = await autoCompressImage(imageUri);
          const response = await fetch(compressedUri);
          const blob = await response.blob();
          const storageRef = ref(storage, `replies/${user.uid}/${Date.now()}_${Math.random()}.jpg`);
          await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
          return await getDownloadURL(storageRef);
        });
        
        imageUrls = await Promise.all(uploadPromises);
        imageUrl = imageUrls[0]; // Keep first image for backward compatibility
      } catch (uploadError) {
        console.error('Reply images upload failed:', uploadError);
        // Continue without images
      }
    } else if (replyData.imageUri) {
      // Handle single image (backward compatibility)
      try {
        await validateImage(replyData.imageUri);
        const compressedUri = await autoCompressImage(replyData.imageUri);
        const response = await fetch(compressedUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `replies/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        imageUrl = await getDownloadURL(storageRef);
        imageUrls = [imageUrl];
      } catch (uploadError) {
        console.error('Reply image upload failed:', uploadError);
        // Continue without image
      }
    }

    const reply = {
      text: replyData.text?.trim() || '',
      imageUrl, // First image for backward compatibility
      imageUrls, // Array of all images
      images: imageUrls, // Also store as 'images' for consistency
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'User',
      userPhone: user.phoneNumber || '',
      createdAt: serverTimestamp(),
    };

    // Add reply to subcollection
    await addDoc(collection(db, POSTS_COLLECTION, postId, 'replies'), reply);
    
    return true;
  } catch (error) {
    console.error('Add reply error:', error);
    throw error;
  }
};

// Simple function to get reply count for a single post
export const getReplyCount = async (postId) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      return 0;
    }
    
    // Query the replies subcollection under the specific post
    const repliesRef = collection(db, POSTS_COLLECTION, postId, 'replies');
    const snapshot = await getDocs(repliesRef);
    return snapshot.size;
  } catch (error) {
    console.error(`Error getting reply count for post ${postId}:`, error);
    return 0; // Return 0 instead of throwing error
  }
};

export const listenPostsWithReplies = (cb) => {
  // Use the basic posts listener instead to avoid permission issues
  return listenPosts(cb);
};

export const listenReplies = (postId, cb) => {
  if (!postId) return () => {};
  
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.warn('listenReplies: User not authenticated');
    cb([]);
    return () => {};
  }
  
  try {
    const repliesRef = collection(db, POSTS_COLLECTION, postId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb(items);
      },
      (error) => {
        console.error('Replies listener error:', error);
        // Return empty array on error instead of breaking the app
        cb([]);
      }
    );
  } catch (error) {
    console.error('Failed to setup replies listener:', error);
    cb([]);
    return () => {};
  }
};

export const mapPostForUI = (post, favoritesSet, repliesCount = 0) => {
  const likedByUser = favoritesSet?.has(post.id);
  
  // Format time safely
  let timeStr = '';
  try {
    if (post.createdAt?.toDate) {
      const date = post.createdAt.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) timeStr = 'Just now';
      else if (diffMins < 60) timeStr = `${diffMins}m ago`;
      else if (diffHours < 24) timeStr = `${diffHours}h ago`;
      else if (diffDays < 7) timeStr = `${diffDays}d ago`;
      else timeStr = date.toLocaleDateString();
    }
  } catch (e) {
    timeStr = '';
  }
  
  return {
    id: post.id,
    question: post.title || post.description || 'Post',
    title: post.title,
    description: post.description,
    location: post.location,
    coordinates: post.coordinates, // Include coordinates in mapped data
    price: post.price,
    type: post.type,
    likes: likedByUser ? 1 : 0,
    replies: repliesCount, // Use actual replies count
    likedByUser,
    user: {
      name: post.userName || post.user?.name || 'User',
      avatar: post.user?.avatar || ((post.userName || post.user?.name || 'U').slice(0, 2).toUpperCase()),
      verified: post.user?.verified === true,
    },
    time: timeStr,
    imageUrl: post.imageUrl,
    raw: post,
  };
};

// Function to delete a post
export const deletePost = async (postId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('🗑️ Deleting post:', postId);
    
    // Get the post first to check ownership
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    const post = postDoc.data();
    
    // Check if user owns the post
    if (post.userId !== user.uid) {
      throw new Error('You can only delete your own posts');
    }
    
    // Delete the post
    await deleteDoc(postRef);
    
    console.log('✅ Post deleted successfully');
  } catch (error) {
    console.error('❌ Delete post error:', error);
    throw error;
  }
};

// Function to delete all posts by current user
export const deleteAllUserPosts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('🗑️ Deleting all posts for user:', user.uid);
    
    // Get all posts by the current user
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(postsRef);
    const querySnapshot = await getDocs(q);
    
    // Filter posts by current user
    const userPosts = querySnapshot.docs.filter(doc => {
      const post = doc.data();
      return post.userId === user.uid;
    });
    
    if (userPosts.length === 0) {
      throw new Error('No posts found to delete');
    }
    
    console.log(`🗑️ Found ${userPosts.length} posts to delete`);
    
    // Delete all user posts
    const deletePromises = userPosts.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${userPosts.length} posts`);
    return userPosts.length;
  } catch (error) {
    console.error('❌ Delete all posts error:', error);
    throw error;
  }
};

// Function to delete ALL posts from ALL users (admin function)
export const deleteAllPosts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('🗑️ Deleting ALL posts from database...');
    
    // Get ALL posts from the database
    const postsRef = collection(db, POSTS_COLLECTION);
    const querySnapshot = await getDocs(postsRef);
    
    if (querySnapshot.empty) {
      throw new Error('No posts found to delete');
    }
    
    console.log(`🗑️ Found ${querySnapshot.docs.length} posts to delete`);
    
    // Delete all posts
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${querySnapshot.docs.length} posts`);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('❌ Delete all posts error:', error);
    throw error;
  }
};

// Function to update existing posts with coordinates
export const updatePostsWithCoordinates = async () => {
  try {
    console.log('🌍 Starting batch geocoding of existing posts...');
    
    const postsRef = collection(db, POSTS_COLLECTION);
    const snapshot = await getDocs(postsRef);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const post = docSnap.data();
      
      // Skip if already has coordinates or no location
      if (post.coordinates || !post.location) {
        skippedCount++;
        continue;
      }
      
      try {
        console.log(`🌍 Geocoding post ${docSnap.id}: ${post.location}`);
        
        const geocodeResult = await geocodeLocation(post.location);
        const coordinates = {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        };
        
        // Update the post with coordinates
        await updateDoc(doc(db, POSTS_COLLECTION, docSnap.id), {
          coordinates: coordinates,
          location: geocodeResult.formattedAddress // Update with formatted address
        });
        
        updatedCount++;
        console.log(`✅ Updated post ${docSnap.id} with coordinates:`, coordinates);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Failed to geocode post ${docSnap.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🌍 Batch geocoding complete:`, {
      total: snapshot.docs.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount
    });
    
    return {
      total: snapshot.docs.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('❌ Batch geocoding failed:', error);
    throw error;
  }
};

