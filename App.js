/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
/* eslint-enable no-unused-vars */
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/lib/firebase';
import AuthScreen from './src/screens/AuthScreen';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapViewScreen from './src/screens/MapViewScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import MyPostsScreen from './src/screens/MyPostsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import OfflineDataScreen from './src/screens/OfflineDataScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { initializeAdMob } from './src/services/admob';
import { handleAsyncError } from './src/utils/errorHandler';
import { initCrashlytics, setUserId } from './src/services/crashlytics';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Safe notification functions for Expo Go compatibility
const safeRequestNotifications = async () => {
  if (isExpoGo) {
    console.log('Notifications limited in Expo Go - use development build for full features');
    return false;
  }
  
  try {
    if (Notifications && Notifications.requestPermissionsAsync) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('Push token:', token.data);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('Error requesting notifications:', error);
    return false;
  }
};

const safeAddNotificationListener = (callback) => {
  if (isExpoGo) {
    console.log('Notification listeners limited in Expo Go');
    return { remove: () => {} };
  }
  
  try {
    if (Notifications && Notifications.addNotificationResponseReceivedListener) {
      return Notifications.addNotificationResponseReceivedListener(callback);
    }
    return { remove: () => {} };
  } catch (error) {
    console.warn('Error setting up notification listener:', error);
    return { remove: () => {} };
  }
};

function MainTabs({ onLogout }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={focused ? '#9333EA' : '#6B7280'} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: () => <Text>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: focused ? '#EC4899' : '#9333EA',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Text style={{ fontSize: 32, color: 'white', fontWeight: '300' }}>+</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: () => <Text>💬</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        children={(props) => <ProfileScreen {...props} onLogout={onLogout} />}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize Crashlytics
    initCrashlytics();
    
    // Initialize AdMob
    initializeAdMob();

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setIsLoading(false);
      
      // Set user ID in Crashlytics for tracking
      if (fbUser) {
        setUserId(fbUser.uid);
      }
      
      // Request notification permissions when user logs in (with delay to ensure auth is complete)
      if (fbUser) {
        setTimeout(() => {
          handleAsyncError(
            () => safeRequestNotifications(),
            null
          );
        }, 1500); // 1.5 second delay to ensure auth is fully complete
      }
    });

    // Listen for notification responses
    let notificationListener;
    try {
      notificationListener = safeAddNotificationListener(response => {
        const data = response?.notification?.request?.content?.data || {};
        
        // Handle notification tap based on type
        if (data.type === 'new_message' && data.chatId) {
          // Navigate to chat (you can implement navigation here)
          console.log('Navigate to chat:', data.chatId);
        } else if (data.type === 'new_reply' && data.postId) {
          // Navigate to post (you can implement navigation here)
          console.log('Navigate to post:', data.postId);
        }
      });
    } catch (error) {
      console.warn('Failed to setup notification listener:', error);
    }

    return () => {
      unsub();
      notificationListener?.remove?.();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user == null ? (
          <Stack.Screen name="Auth">
            {() => <AuthScreen />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs onLogout={() => signOut(auth)} />}
            </Stack.Screen>
            <Stack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{ headerShown: true, title: 'Post Detail' }}
            />
            <Stack.Screen
              name="MapView"
              component={MapViewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyPosts"
              component={MyPostsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BlockedUsers"
              component={BlockedUsersScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OfflineData"
              component={OfflineDataScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);