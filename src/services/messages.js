import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

// Create or get existing chat between two users
export const createOrGetChat = async (otherUserId, otherUserName) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error('Not authenticated');

    // Create chat ID (sorted to ensure consistency)
    const chatId = [currentUserId, otherUserId].sort().join('_');
    
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      // Create new chat
      await setDoc(chatRef, {
        participants: [currentUserId, otherUserId],
        participantNames: {
          [currentUserId]: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
          [otherUserId]: otherUserName,
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    return chatId;
  } catch (error) {
    console.error('Create chat error:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (chatId, text) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const message = {
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'User',
      text: text.trim(),
      createdAt: serverTimestamp(),
      read: false,
    };

    await addDoc(collection(db, MESSAGES_COLLECTION), message);

    // Update last message in chat
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await setDoc(chatRef, {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

// Listen to messages in a chat
export const listenToMessages = (chatId, callback) => {
  if (!chatId) return () => {};
  
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Sort by createdAt on client side to avoid index requirement
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeA - timeB; // Ascending order (oldest first)
      });
      
      callback(messages);
    }, (error) => {
      console.error('Messages listener error:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Failed to setup messages listener:', error);
    callback([]);
    return () => {};
  }
};

// Get user's chats
export const listenToChats = (callback) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return () => {};

  try {
    const chatsRef = collection(db, CHATS_COLLECTION);
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUserId)
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Sort by lastMessageTime on client side to avoid index requirement
      .sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      
      callback(chats);
    }, (error) => {
      console.error('Chats listener error:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Failed to setup chats listener:', error);
    callback([]);
    return () => {};
  }
};

// Mark messages as read - Temporary client-side filtering until index is ready
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    // Filter on client side until composite index is ready
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.senderId !== userId && data.read === false) {
        batch.update(doc.ref, { read: true, readAt: serverTimestamp() });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Mark messages as read error:', error);
  }
};

// Set typing status
export const setTypingStatus = async (chatId, isTyping) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const typingRef = doc(db, 'typing', `${chatId}_${currentUser.uid}`);
    
    if (isTyping) {
      await setDoc(typingRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'User',
        chatId,
        isTyping: true,
        timestamp: serverTimestamp(),
      });
    } else {
      await setDoc(typingRef, {
        isTyping: false,
        timestamp: serverTimestamp(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Set typing status error:', error);
  }
};

// Listen to typing status - Temporary client-side filtering until index is ready
export const listenToTypingStatus = (chatId, callback) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId || !chatId) return () => {};

  try {
    const typingRef = collection(db, 'typing');
    const q = query(
      typingRef,
      where('chatId', '==', chatId)
    );

    return onSnapshot(q, (snapshot) => {
      const typingUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Filter on client side until composite index is ready
      .filter(typing => {
        const timestamp = typing.timestamp?.toDate?.() || new Date(0);
        const now = new Date();
        return (
          typing.userId !== currentUserId && 
          typing.isTyping === true &&
          (now - timestamp) < 10000 // 10 seconds
        );
      });
      
      callback(typingUsers);
    }, (error) => {
      console.error('Typing status listener error:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Failed to setup typing listener:', error);
    callback([]);
    return () => {};
  }
};

// Get unread message count for a chat
export const getUnreadCount = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};
