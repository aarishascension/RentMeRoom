import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HelpSupportScreen({ navigation }) {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'How do I create a room listing?',
      answer: 'Tap the "+" button on the home screen, fill in the details about your room including photos, price, and location, then tap "Post" to publish your listing.',
    },
    {
      id: 2,
      question: 'How do I contact someone about a room?',
      answer: 'Tap on any room listing to view details, then tap the "Message" button to start a conversation with the room owner.',
    },
    {
      id: 3,
      question: 'How do I save rooms I like?',
      answer: 'Tap the heart icon on any room listing to save it to your favorites. You can view all saved rooms in your profile under "Favorites".',
    },
    {
      id: 4,
      question: 'How do I edit or delete my posts?',
      answer: 'Go to your profile and tap "My Posts" to see all your listings. You can edit or delete any of your posts from there.',
    },
    {
      id: 5,
      question: 'How do I report inappropriate content?',
      answer: 'Tap the three dots menu on any post or message and select "Report". Choose the appropriate reason and we\'ll review it.',
    },
    {
      id: 6,
      question: 'How do I block a user?',
      answer: 'In any conversation, tap the user\'s name at the top, then select "Block User". You can manage blocked users in your profile settings.',
    },
    {
      id: 7,
      question: 'How does offline mode work?',
      answer: 'Enable offline mode in settings to cache posts and messages. When offline, you can still browse cached content and your actions will sync when you\'re back online.',
    },
    {
      id: 8,
      question: 'How do I verify my account?',
      answer: 'Go to your profile and tap "Verification". You can verify your phone number, email, or upload documents to build trust with other users.',
    },
  ];

  const contactOptions = [
    {
      id: 1,
      title: 'Email Support',
      subtitle: 'Get help via email',
      icon: 'mail',
      color: '#3B82F6',
      action: () => {
        Linking.openURL('mailto:support@rentmeroom.com?subject=Help Request');
      },
    },
    {
      id: 2,
      title: 'WhatsApp Support',
      subtitle: 'Chat with us on WhatsApp',
      icon: 'logo-whatsapp',
      color: '#10B981',
      action: () => {
        Linking.openURL('https://wa.me/1234567890?text=Hi, I need help with RentMeRoom app');
      },
    },
    {
      id: 3,
      title: 'Call Support',
      subtitle: 'Speak with our team',
      icon: 'call',
      color: '#EF4444',
      action: () => {
        Alert.alert(
          'Call Support',
          'Would you like to call our support team?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL('tel:+1234567890') },
          ]
        );
      },
    },
    {
      id: 4,
      title: 'Live Chat',
      subtitle: 'Chat with support agent',
      icon: 'chatbubbles',
      color: '#8B5CF6',
      action: () => {
        Alert.alert(
          'Contact Support',
          'Choose how you would like to reach us:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Email Support',
              onPress: () => {
                Linking.openURL('mailto:support@rentmeroom.com?subject=Support Request');
              },
            },
            {
              text: 'WhatsApp',
              onPress: () => {
                const phoneNumber = '1234567890'; // Replace with actual support number
                const message = 'Hi, I need help with RentMeRoom app';
                const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                Linking.canOpenURL(whatsappUrl).then(supported => {
                  if (supported) {
                    Linking.openURL(whatsappUrl);
                  } else {
                    Alert.alert('WhatsApp not installed', 'Please install WhatsApp or use email support');
                  }
                });
              },
            },
          ]
        );
      },
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Report a Bug',
      icon: 'bug',
      color: '#EF4444',
      action: () => {
        Alert.alert(
          'Report a Bug',
          'Please describe the issue you encountered and we\'ll fix it as soon as possible.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Send Email', 
              onPress: () => Linking.openURL('mailto:bugs@rentmeroom.com?subject=Bug Report')
            },
          ]
        );
      },
    },
    {
      id: 2,
      title: 'Feature Request',
      icon: 'bulb',
      color: '#F59E0B',
      action: () => {
        Alert.alert(
          'Feature Request',
          'Have an idea for a new feature? We\'d love to hear it!',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Send Email', 
              onPress: () => Linking.openURL('mailto:features@rentmeroom.com?subject=Feature Request')
            },
          ]
        );
      },
    },
    {
      id: 3,
      title: 'Privacy Policy',
      icon: 'shield-checkmark',
      color: '#10B981',
      action: () => {
        Alert.alert('Privacy Policy', 'Opening privacy policy in browser...');
        // Linking.openURL('https://rentmeroom.com/privacy');
      },
    },
    {
      id: 4,
      title: 'Terms of Service',
      icon: 'document-text',
      color: '#6B7280',
      action: () => {
        Alert.alert('Terms of Service', 'Opening terms of service in browser...');
        // Linking.openURL('https://rentmeroom.com/terms');
      },
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const ContactCard = ({ item }) => (
    <TouchableOpacity style={styles.contactCard} onPress={item.action}>
      <View style={[styles.contactIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{item.title}</Text>
        <Text style={styles.contactSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const QuickActionCard = ({ item }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={item.action}>
      <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="white" />
      </View>
      <Text style={styles.quickActionTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const FAQItem = ({ item }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => toggleFAQ(item.id)}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Ionicons
          name={expandedFAQ === item.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
      {expandedFAQ === item.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>
            Need help? Our support team is here for you
          </Text>
          {contactOptions.map((item) => (
            <ContactCard key={item.id} item={item} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((item) => (
              <QuickActionCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>
            Find answers to common questions
          </Text>
          {faqData.map((item) => (
            <FAQItem key={item.id} item={item} />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.appInfo}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>{Constants.expoConfig?.version || '1.0.4'}</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Build</Text>
              <Text style={styles.appInfoValue}>2024.01.01</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Platform</Text>
              <Text style={styles.appInfoValue}>React Native</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Extra padding for gesture bar
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 32,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  appInfo: {
    gap: 12,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  appInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});