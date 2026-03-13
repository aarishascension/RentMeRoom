import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sendLocalNotification } from './notifications';

// Verification types
export const VERIFICATION_TYPES = {
  PHONE: 'phone',
  EMAIL: 'email',
  DOCUMENT: 'document',
  SOCIAL: 'social'
};

// Verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Submit verification request
export const submitVerification = async (type, data) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const verificationRef = doc(db, 'verifications', `${user.uid}_${type}`);
    
    const verificationData = {
      userId: user.uid,
      type,
      status: VERIFICATION_STATUS.PENDING,
      data,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(verificationRef, verificationData);
    
    // Send notification
    await sendLocalNotification(
      'Verification Submitted',
      `Your ${type} verification has been submitted for review.`
    );

    return true;
  } catch (error) {
    console.error('Submit verification error:', error);
    throw error;
  }
};

// Get user verification status
export const getUserVerificationStatus = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return {};

    const verificationTypes = Object.values(VERIFICATION_TYPES);
    const verifications = {};

    for (const type of verificationTypes) {
      try {
        const verificationRef = doc(db, 'verifications', `${uid}_${type}`);
        const verificationDoc = await getDoc(verificationRef);
        
        if (verificationDoc.exists()) {
          verifications[type] = verificationDoc.data();
        } else {
          verifications[type] = { status: 'not_submitted' };
        }
      } catch (error) {
        console.error(`Error getting ${type} verification:`, error);
        verifications[type] = { status: 'error' };
      }
    }

    return verifications;
  } catch (error) {
    console.error('Get verification status error:', error);
    return {};
  }
};

// Check if user is verified (at least one verification type)
export const isUserVerified = async (userId = null) => {
  try {
    const verifications = await getUserVerificationStatus(userId);
    
    return Object.values(verifications).some(
      verification => verification.status === VERIFICATION_STATUS.VERIFIED
    );
  } catch (error) {
    console.error('Check user verified error:', error);
    return false;
  }
};

// Get verification badge info
export const getVerificationBadge = async (userId = null) => {
  try {
    const verifications = await getUserVerificationStatus(userId);
    const verifiedTypes = [];
    
    Object.entries(verifications).forEach(([type, verification]) => {
      if (verification.status === VERIFICATION_STATUS.VERIFIED) {
        verifiedTypes.push(type);
      }
    });

    if (verifiedTypes.length === 0) {
      return { verified: false, badge: null, types: [] };
    }

    // Determine badge based on verification types
    let badge = '✓';
    if (verifiedTypes.includes(VERIFICATION_TYPES.DOCUMENT)) {
      badge = '🛡️'; // Document verified
    } else if (verifiedTypes.includes(VERIFICATION_TYPES.PHONE)) {
      badge = '📱'; // Phone verified
    } else if (verifiedTypes.includes(VERIFICATION_TYPES.EMAIL)) {
      badge = '✉️'; // Email verified
    }

    return {
      verified: true,
      badge,
      types: verifiedTypes,
      count: verifiedTypes.length
    };
  } catch (error) {
    console.error('Get verification badge error:', error);
    return { verified: false, badge: null, types: [] };
  }
};

// Mock verification for development (remove in production)
export const mockVerifyUser = async (type = VERIFICATION_TYPES.PHONE) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const verificationRef = doc(db, 'verifications', `${user.uid}_${type}`);
    
    await setDoc(verificationRef, {
      userId: user.uid,
      type,
      status: VERIFICATION_STATUS.VERIFIED,
      data: { mock: true },
      submittedAt: serverTimestamp(),
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await sendLocalNotification(
      'Verification Complete',
      `Your ${type} verification has been approved!`
    );

    return true;
  } catch (error) {
    console.error('Mock verify user error:', error);
    throw error;
  }
};