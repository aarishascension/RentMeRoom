# RentMeRoom - Room Rental Mobile Application

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A full-featured React Native mobile application connecting room seekers with room owners, eliminating brokers and reducing rental costs. Published on Google Play Store.

## 🎯 Project Overview

RentMeRoom is a production-ready cross-platform mobile application that provides a modern, user-friendly platform for discovering, listing, and managing room rentals with real-time communication capabilities.

- **Platform:** iOS & Android (Cross-platform)
- **Version:** 1.0.4
- **Status:** Live on Google Play Store

## 🚀 Key Features

### Core Functionality
- **Multi-method Authentication** - Email/Password, Phone OTP, Google Sign-In
- **Room Listings** - Create detailed listings with up to 5 photos
- **Advanced Search** - Location-based search with filters (price, type, keywords)
- **Interactive Maps** - Google Maps integration with custom markers and clustering
- **Real-time Messaging** - One-on-one chat with photo sharing
- **Social Features** - Favorites, comments, user blocking, reporting
- **Push Notifications** - Real-time alerts for messages and replies
- **Offline Support** - Data caching and synchronization
- **Monetization** - Google AdMob integration

### User Experience
- Intuitive bottom tab navigation
- Photo reordering and management
- Verified user badges
- Bulk post management
- Network status monitoring
- Smooth animations and transitions

## 🛠️ Technical Stack

### Frontend
- **React Native** (0.81.5) - Cross-platform mobile framework
- **React** (19.1.0) - UI component library
- **Expo** (~54.0.30) - Development platform
- **React Navigation** - Multi-stack navigation system
- **TypeScript** (5.9.2) - Type-safe development

### Backend & Services
- **Firebase Authentication** - Multi-provider auth system
- **Cloud Firestore** - Real-time NoSQL database
- **Firebase Storage** - Image hosting and management
- **Firebase Cloud Messaging** - Push notifications
- **Google Maps API** - Location services and geocoding
- **Google AdMob** - Mobile advertising platform

### Key Libraries
```json
{
  "@react-native-firebase/app": "^23.8.6",
  "@react-native-google-signin/google-signin": "^16.1.1",
  "react-native-google-mobile-ads": "^16.0.1",
  "react-native-maps": "1.20.1",
  "expo-location": "~19.0.8",
  "expo-notifications": "~0.32.15",
  "@react-native-async-storage/async-storage": "2.2.0"
}
```

## 📁 Project Structure

```
RentMeRoom/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── PostCard.js
│   │   ├── FilterModal.js
│   │   ├── LocationPicker.js
│   │   └── ...
│   ├── screens/          # Application screens
│   │   ├── HomeScreen.js
│   │   ├── AuthScreen.js
│   │   ├── CreatePostScreen.js
│   │   ├── ChatDetailScreen.js
│   │   └── ...
│   ├── services/         # Business logic & API calls
│   │   ├── posts.js
│   │   ├── messages.js
│   │   ├── users.js
│   │   └── ...
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── lib/              # Third-party integrations
├── assets/               # Images, fonts, icons
├── android/              # Android native code
├── App.js               # Application entry point
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
└── package.json         # Dependencies
```

## 🏗️ Architecture & Design Patterns

- **Component-based Architecture** - Modular, reusable components
- **Service Layer Pattern** - Separation of business logic
- **Custom Hooks** - Reusable stateful logic
- **Error Boundary** - Graceful error handling
- **Async/Await** - Modern asynchronous programming

## 🔒 Security Features

- Firebase Security Rules for data protection
- Input sanitization and validation
- Secure authentication flows
- Privacy-focused data management
- User blocking and reporting system

## 📱 Screens & Navigation

### Main Tabs
1. **Home** - Browse room listings with filters
2. **Search** - Advanced search functionality
3. **Create Post** - Quick listing creation
4. **Messages** - Real-time conversations
5. **Profile** - User dashboard

### Additional Screens
- Post Detail, Map View, Chat Detail, My Posts, Favorites, Blocked Users, Notifications, Settings, Help & Support, Privacy Policy

## 🎨 UI/UX Highlights

- Clean, modern interface design
- Smooth animations with React Native Reanimated
- Responsive layouts for all screen sizes
- Intuitive gesture controls
- Loading states and error handling
- Accessibility considerations

## 🚢 Deployment

### Google Play Store
- Successfully published and approved
- Closed testing program implemented
- Compliant with all Google Play policies
- Optimized with ProGuard/R8

### Build System
- **EAS Build** for automated builds
- Keystore management for app signing
- Environment-specific configurations
- Production-ready optimizations

## 📊 Project Metrics

- **18** Functional screens
- **170+** Total files
- **12** Reusable components
- **13** Service modules
- **19** Screen implementations

## 💡 Technical Achievements

### Performance Optimizations
- Efficient list rendering with FlatList
- Image optimization and lazy loading
- Memoization for expensive computations
- Debounced search inputs
- Optimized Firebase queries with indexing

### Complex Integrations
- Multi-provider authentication system
- Real-time data synchronization
- Location services and geocoding
- Push notification handling
- Ad monetization implementation

### Problem Solving
- Resolved Firebase authentication blocking on Android
- Fixed Google Maps black screen issues
- Implemented complex Firestore security rules
- Handled offline/online state transitions
- Optimized cross-platform compatibility

## 🔧 Development Setup

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📝 Environment Variables

Create a `google-services.json` file for Firebase configuration (Android).

## 🧪 Testing

Test credentials for reviewers:
- **Email:** rentmeroom.test@gmail.com
- **Password:** TestAccount2024!

## 📄 Documentation

Comprehensive documentation available:
- User Guide
- Interview Preparation Guide
- Testing Checklist
- Release Notes
- Privacy Policy

## 🎓 Skills Demonstrated

### Mobile Development
- React Native cross-platform development
- Native module integration
- Mobile UI/UX design patterns
- Touch gestures and animations

### Backend & Cloud
- Firebase ecosystem mastery
- Real-time database design
- Cloud storage management
- Authentication systems

### API Integration
- Google Maps API
- Google Sign-In
- AdMob advertising
- RESTful API consumption

### Development Practices
- Version control with Git
- Agile methodology
- Comprehensive documentation
- Production deployment

## 🔮 Future Enhancements

- Payment integration for premium features
- AI-powered room recommendations
- Video tour capabilities
- Multi-language support
- Rating and review system
- Virtual room tours with AR

## 📞 Contact

**Developer:** [Your Name]
- **Email:** [your.email@example.com]
- **LinkedIn:** [Your LinkedIn Profile]
- **Portfolio:** [Your Portfolio Website]
- **GitHub:** [Your GitHub Profile]

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note:** This is a portfolio project demonstrating full-stack mobile development capabilities. Some features may require API keys and Firebase configuration to run locally.
