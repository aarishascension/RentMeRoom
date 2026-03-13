import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteUser, updateProfile } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const USERS_COLLECTION = 'users';

// Get or create user profile
export const getUserProfile = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    console.log('🔍 Getting user profile for:', uid);
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const profileData = { id: userDoc.id, ...userDoc.data() };
      console.log('✅ User profile found:', profileData);
      return profileData;
    } else {
      console.log('⚠️ User profile not found, creating default...');
      // Create default profile
      const currentUser = auth.currentUser;
      const defaultProfile = {
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
        email: currentUser?.email || '',
        phone: currentUser?.phoneNumber || '',
        avatar: '👤',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userRef, defaultProfile);
      console.log('✅ Default profile created:', defaultProfile);
      return { id: uid, ...defaultProfile };
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    console.log('🔄 Updating user profile with:', updates);
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    await updateDoc(userRef, updateData);
    console.log('✅ User profile updated successfully');

    return true;
  } catch (error) {
    console.error('❌ Update user profile error:', error);
    throw error;
  }
};

// Get user stats (posts, responses, etc.)
export const getUserStats = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    // Get user's posts count
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', uid)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const postsCount = postsSnapshot.size;

    // Get user's replies count
    const repliesQuery = query(
      collection(db, 'replies'),
      where('userId', '==', uid)
    );
    const repliesSnapshot = await getDocs(repliesQuery);
    const repliesCount = repliesSnapshot.size;

    // Calculate total views (sum of views from all posts)
    let totalViews = 0;
    postsSnapshot.forEach(doc => {
      const post = doc.data();
      totalViews += post.views || 0;
    });

    return {
      posts: postsCount,
      responses: repliesCount,
      views: totalViews,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { posts: 0, responses: 0, views: 0 };
  }
};

// Search users by name or email
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm.trim()) return [];

    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach(doc => {
      const user = { id: doc.id, ...doc.data() };
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      if (name.includes(search) || email.includes(search)) {
        users.push(user);
      }
    });

    return users;
  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
};

// Check if username is available
export const checkUsernameAvailability = async (newUsername) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    
    let isAvailable = true;
    snapshot.forEach(doc => {
      const user = doc.data();
      const existingName = (user.name || '').toLowerCase().trim();
      const checkName = newUsername.toLowerCase().trim();
      
      // Skip current user's document
      if (doc.id === currentUser.uid) return;
      
      if (existingName === checkName) {
        isAvailable = false;
      }
    });

    return isAvailable;
  } catch (error) {
    console.error('Check username availability error:', error);
    return false;
  }
};

// Update username across the entire app
export const updateUsername = async (newUsername) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const trimmedUsername = newUsername.trim();
    console.log('🔄 Starting username update process:', trimmedUsername);
    
    // Validate username
    if (!trimmedUsername) {
      throw new Error('Username cannot be empty');
    }
    
    if (trimmedUsername.length < 2) {
      throw new Error('Username must be at least 2 characters long');
    }
    
    if (trimmedUsername.length > 30) {
      throw new Error('Username must be less than 30 characters');
    }
    
    // Check if username contains only valid characters
    const validUsernameRegex = /^[a-zA-Z0-9\s._-]+$/;
    if (!validUsernameRegex.test(trimmedUsername)) {
      throw new Error('Username can only contain letters, numbers, spaces, dots, underscores, and hyphens');
    }

    console.log('✅ Username validation passed');

    // Check availability
    console.log('🔍 Checking username availability...');
    const isAvailable = await checkUsernameAvailability(trimmedUsername);
    if (!isAvailable) {
      throw new Error('This username is already taken. Please choose a different one.');
    }
    console.log('✅ Username is available');

    // Update Firebase Auth displayName
    console.log('🔄 Updating Firebase Auth displayName...');
    await updateProfile(currentUser, {
      displayName: trimmedUsername
    });
    console.log('✅ Firebase Auth displayName updated');

    // Update user profile document
    console.log('🔄 Updating user profile document...');
    await updateUserProfile({ name: trimmedUsername });
    console.log('✅ User profile document updated');

    console.log('✅ Username updated successfully to:', trimmedUsername);
    return true;
  } catch (error) {
    console.error('❌ Update username error:', error);
    throw error;
  }
};

// Deactivate account (soft delete - keeps data but marks as inactive)
export const deactivateAccount = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    console.log('🔄 Deactivating account for user:', currentUser.uid);

    // Update user profile to mark as deactivated
    const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
    await updateDoc(userRef, {
      isActive: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    });

    // Hide all user's posts (mark as inactive)
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', currentUser.uid)
    );
    const postsSnapshot = await getDocs(postsQuery);
    
    const batch = writeBatch(db);
    postsSnapshot.forEach(postDoc => {
      batch.update(postDoc.ref, { 
        isActive: false,
        deactivatedAt: new Date()
      });
    });
    await batch.commit();

    // Sign out user
    await auth.signOut();
    await AsyncStorage.clear();

    console.log('✅ Account deactivated successfully');
    return true;
  } catch (error) {
    console.error('❌ Deactivate account error:', error);
    throw error;
  }
};

// Delete account permanently (hard delete - removes all data)
export const deleteAccount = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    console.log('🔄 Permanently deleting account for user:', currentUser.uid);

    const batch = writeBatch(db);

    // Delete user's posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', currentUser.uid)
    );
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.forEach(postDoc => {
      batch.delete(postDoc.ref);
    });

    // Delete user's replies
    const repliesQuery = query(
      collection(db, 'replies'),
      where('userId', '==', currentUser.uid)
    );
    const repliesSnapshot = await getDocs(repliesQuery);
    repliesSnapshot.forEach(replyDoc => {
      batch.delete(replyDoc.ref);
    });

    // Delete user's chats (where they are a participant)
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    chatsSnapshot.forEach(chatDoc => {
      batch.delete(chatDoc.ref);
    });

    // Delete user's messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.forEach(messageDoc => {
      batch.delete(messageDoc.ref);
    });

    // Delete user's favorites
    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', currentUser.uid)
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    favoritesSnapshot.forEach(favoriteDoc => {
      batch.delete(favoriteDoc.ref);
    });

    // Delete user profile
    const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
    batch.delete(userRef);

    // Execute all deletions
    await batch.commit();

    // Delete Firebase Auth account
    await deleteUser(currentUser);

    // Clear local storage
    await AsyncStorage.clear();

    console.log('✅ Account deleted permanently');
    return true;
  } catch (error) {
    console.error('❌ Delete account error:', error);
    throw error;
  }
};