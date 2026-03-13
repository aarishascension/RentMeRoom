import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get notification permissions');
      return null;
    }
    
    console.log('✅ Notification permissions granted');
    
    // Try to get push token, but don't fail if Firebase isn't configured
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData?.data;
      
      if (token) {
        console.log('✅ Push token obtained:', token);
        
        // Save token to user profile (only if user is authenticated)
        const user = auth.currentUser;
        if (user && user.uid) {
          try {
            await setDoc(doc(db, 'users', user.uid), {
              pushToken: token,
              lastTokenUpdate: serverTimestamp(),
            }, { merge: true });
            console.log('✅ Push token saved to user profile');
          } catch (firestoreError) {
            console.warn('⚠️ Failed to save push token to Firestore:', firestoreError);
          }
        }
        
        return token;
      }
    } catch (tokenError) {
      console.warn('⚠️ Could not get push token (FCM not configured):', tokenError.message);
      console.log('📱 Local notifications will still work');
    }
    
    return 'local-only'; // Indicate that local notifications are available
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return null;
  }
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

// Listen for notification responses
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Listen for notifications received while app is in foreground
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  NEW_REPLY: 'new_reply',
  POST_LIKED: 'post_liked',
  NEW_POST_IN_AREA: 'new_post_in_area',
};

// Send notification for new message
export const notifyNewMessage = async (chatId, senderName, messageText) => {
  await sendLocalNotification(
    `New message from ${senderName}`,
    messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
    { 
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      chatId,
      senderName 
    }
  );
};

// Send notification for new reply
export const notifyNewReply = async (postId, replierName, replyText) => {
  await sendLocalNotification(
    `New reply from ${replierName}`,
    replyText.length > 50 ? `${replyText.substring(0, 50)}...` : replyText,
    { 
      type: NOTIFICATION_TYPES.NEW_REPLY,
      postId,
      replierName 
    }
  );
};

// Send notification for post liked
export const notifyPostLiked = async (postTitle, likerName) => {
  await sendLocalNotification(
    'Your post was liked!',
    `${likerName} liked your post: ${postTitle}`,
    { 
      type: NOTIFICATION_TYPES.POST_LIKED,
      likerName 
    }
  );
};