import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import {
    listenToMessages,
    listenToTypingStatus,
    markMessagesAsRead,
    sendMessage,
    setTypingStatus
} from '../services/messages';

export default function ChatDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { chatId, title = 'Chat' } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const typingTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;
    
    // Listen to messages
    const unsubscribeMessages = listenToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      
      // Mark messages as read when they arrive
      if (currentUserId) {
        markMessagesAsRead(chatId, currentUserId);
      }
    });
    
    // Listen to typing status
    const unsubscribeTyping = listenToTypingStatus(chatId, setTypingUsers);
    
    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId, currentUserId]);

  // Handle typing indicator
  const handleTextChange = (newText) => {
    setText(newText);
    
    // Set typing status
    if (newText.trim() && !typingTimeoutRef.current) {
      setTypingStatus(chatId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chatId, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    
    setSending(true);
    
    // Stop typing indicator
    setTypingStatus(chatId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    try {
      await sendMessage(chatId, text);
      setText('');
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.senderId === currentUserId;
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.text}</Text>
        <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
          {item.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </LinearGradient>
      
      <View style={styles.chatContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={[styles.chatArea, { marginBottom: keyboardHeight > 0 ? keyboardHeight + 80 : (insets.bottom + 100) }]}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => {
            const mine = item.senderId === currentUserId;
            return (
              <View key={item.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.text}</Text>
                <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
                  {item.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                </Text>
              </View>
            );
          })}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>
                {typingUsers.map(user => user.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </Text>
            </View>
          )}
        </ScrollView>
        
        <View style={[
          styles.inputRow, 
          { 
            bottom: keyboardHeight > 0 ? keyboardHeight + 20 : (insets.bottom + 20),
            position: 'absolute',
            left: 0,
            right: 0
          }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} 
            onPress={send}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : 40, 
    paddingBottom: 16, 
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleMine: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#8B5CF6',
  },
  bubbleTheirs: { 
    alignSelf: 'flex-start', 
    backgroundColor: 'white',
  },
  msgText: { 
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextMine: {
    color: 'white',
  },
  msgTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMine: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});







