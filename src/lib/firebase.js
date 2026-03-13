import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config provided by user
const firebaseConfig = {
  apiKey: 'AIzaSyBygX6BAokJ3DfenwEUYjV-QCpiTDj2x9I',
  authDomain: 'rent-me-room-989b2.firebaseapp.com',
  projectId: 'rent-me-room-989b2',
  storageBucket: 'rent-me-room-989b2.firebasestorage.app',
  messagingSenderId: '493445910286',
  appId: '1:493445910286:web:32640fa55cb3f1d908115f',
  measurementId: 'G-7S96JWNQCJ',
};

const app = initializeApp(firebaseConfig);

// Use React Native persistence for auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore with RN-friendly settings for Android
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Better for Android network conditions
  });
} catch (error) {
  console.warn('Firestore init failed, using default:', error);
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };


