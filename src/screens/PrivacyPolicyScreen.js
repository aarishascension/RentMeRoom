import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Privacy Policy for RentMeRoom</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.text}>
          We collect information you provide directly to us, such as when you create an account, 
          post listings, or contact other users. This may include your name, email address, 
          phone number, and property details.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use the information we collect to provide, maintain, and improve our services, 
          including to facilitate property rentals, communicate with users, and provide customer support.
        </Text>

        <Text style={styles.sectionTitle}>3. Advertising</Text>
        <Text style={styles.text}>
          Our app displays advertisements provided by Google AdMob. AdMob may collect and use 
          information about your device and app usage to show you relevant ads. This may include:
        </Text>
        <Text style={styles.bulletPoint}>• Device information (model, OS version)</Text>
        <Text style={styles.bulletPoint}>• App usage data</Text>
        <Text style={styles.bulletPoint}>• Location data (if permitted)</Text>
        <Text style={styles.bulletPoint}>• Advertising identifiers</Text>

        <Text style={styles.text}>
          You can opt out of personalized advertising by adjusting your device's ad settings.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.text}>
          We do not sell, trade, or otherwise transfer your personal information to third parties 
          except as described in this policy. We may share information with service providers 
          who assist us in operating our app.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate security measures to protect your personal information against 
          unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.text}>
          You have the right to access, update, or delete your personal information. 
          You can do this through your account settings or by contacting us.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.contact}>Email: ahsaanaarish@gmail.com</Text>
        <Text style={styles.contact}>Address: akanipath Ghoramara Guwahati Assam</Text>
        <Text style={styles.contact}>Phone: +917576920017</Text>

        <Text style={styles.sectionTitle}>8. Account Deletion</Text>
        <Text style={styles.text}>
          You can delete your RentMeRoom account at any time through the app settings. 
          To delete your account:
        </Text>
        <Text style={styles.bulletPoint}>• Open the RentMeRoom app</Text>
        <Text style={styles.bulletPoint}>• Go to Profile → Settings → Account Management</Text>
        <Text style={styles.bulletPoint}>• Tap "Delete Account" and confirm</Text>
        
        <Text style={styles.text}>
          When you delete your account, we permanently remove:
        </Text>
        <Text style={styles.bulletPoint}>• Your profile information (name, email, phone)</Text>
        <Text style={styles.bulletPoint}>• All your posts and messages</Text>
        <Text style={styles.bulletPoint}>• Your favorites and activity data</Text>
        <Text style={styles.bulletPoint}>• All associated photos and files</Text>
        
        <Text style={styles.text}>
          Account deletion is immediate and cannot be undone. Some data may be retained 
          for legal compliance or fraud prevention for up to 30 days.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. We will notify you of any 
          changes by posting the new Privacy Policy on this page.
        </Text>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginLeft: 16,
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 4,
  },
});