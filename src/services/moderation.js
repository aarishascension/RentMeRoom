import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sendLocalNotification } from './notifications';

// Report types
export const REPORT_TYPES = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  FAKE_LISTING: 'fake_listing',
  SCAM: 'scam',
  OTHER: 'other'
};

// Report status
export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

// Block a user
export const blockUser = async (userIdToBlock, reason = '') => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    if (currentUser.uid === userIdToBlock) {
      throw new Error('Cannot block yourself');
    }

    const blockRef = doc(db, 'blocks', `${currentUser.uid}_${userIdToBlock}`);
    
    await setDoc(blockRef, {
      blockerId: currentUser.uid,
      blockedUserId: userIdToBlock,
      reason,
      createdAt: serverTimestamp(),
    });

    await sendLocalNotification(
      'User Blocked',
      'User has been blocked successfully.'
    );

    return true;
  } catch (error) {
    console.error('Block user error:', error);
    throw error;
  }
};

// Unblock a user
export const unblockUser = async (userIdToUnblock) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const blockRef = doc(db, 'blocks', `${currentUser.uid}_${userIdToUnblock}`);
    await deleteDoc(blockRef);

    await sendLocalNotification(
      'User Unblocked',
      'User has been unblocked successfully.'
    );

    return true;
  } catch (error) {
    console.error('Unblock user error:', error);
    throw error;
  }
};

// Check if user is blocked
export const isUserBlocked = async (userId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const blockRef = doc(db, 'blocks', `${currentUser.uid}_${userId}`);
    const blockDoc = await getDoc(blockRef);
    
    return blockDoc.exists();
  } catch (error) {
    console.error('Check user blocked error:', error);
    return false;
  }
};

// Get blocked users list
export const getBlockedUsers = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const blocksRef = collection(db, 'blocks');
    const q = query(blocksRef, where('blockerId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Get blocked users error:', error);
    return [];
  }
};

// Report a user
export const reportUser = async (reportedUserId, reportType, description, additionalData = {}) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    if (currentUser.uid === reportedUserId) {
      throw new Error('Cannot report yourself');
    }

    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || currentUser.email || 'User',
      reportedUserId,
      reportType,
      description,
      status: REPORT_STATUS.PENDING,
      createdAt: serverTimestamp(),
      ...additionalData,
    };

    await addDoc(collection(db, 'reports'), reportData);

    await sendLocalNotification(
      'Report Submitted',
      'Your report has been submitted for review.'
    );

    return true;
  } catch (error) {
    console.error('Report user error:', error);
    throw error;
  }
};

// Report a post
export const reportPost = async (postId, reportType, description) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || currentUser.email || 'User',
      postId,
      reportType,
      description,
      status: REPORT_STATUS.PENDING,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'post_reports'), reportData);

    await sendLocalNotification(
      'Post Reported',
      'Post has been reported for review.'
    );

    return true;
  } catch (error) {
    console.error('Report post error:', error);
    throw error;
  }
};

// Get user's reports
export const getUserReports = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('reporterId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Get user reports error:', error);
    return [];
  }
};

// Filter content based on blocked users
export const filterBlockedContent = async (posts) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return posts;

    const blockedUsers = await getBlockedUsers();
    const blockedUserIds = new Set(blockedUsers.map(block => block.blockedUserId));

    return posts.filter(post => !blockedUserIds.has(post.userId));
  } catch (error) {
    console.error('Filter blocked content error:', error);
    return posts;
  }
};

// Check if current user is blocked by another user
export const isBlockedByUser = async (userId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const blockRef = doc(db, 'blocks', `${userId}_${currentUser.uid}`);
    const blockDoc = await getDoc(blockRef);
    
    return blockDoc.exists();
  } catch (error) {
    console.error('Check blocked by user error:', error);
    return false;
  }
};

// Get report reasons for UI
export const getReportReasons = () => {
  return [
    { value: REPORT_TYPES.SPAM, label: 'Spam or unwanted content' },
    { value: REPORT_TYPES.HARASSMENT, label: 'Harassment or bullying' },
    { value: REPORT_TYPES.INAPPROPRIATE_CONTENT, label: 'Inappropriate content' },
    { value: REPORT_TYPES.FAKE_LISTING, label: 'Fake or misleading listing' },
    { value: REPORT_TYPES.SCAM, label: 'Scam or fraud' },
    { value: REPORT_TYPES.OTHER, label: 'Other' },
  ];
};