import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

// Native ads are disabled - Banner ads are used instead
// This component returns null to avoid showing placeholder
export default function NativeAd({ style }) {
  // Return null to hide the component completely
  return null;
  
  /* Placeholder UI (disabled)
  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Ionicons name="megaphone-outline" size={24} color="#9CA3AF" />
        <Text style={styles.placeholderText}>Native Ad Placeholder</Text>
        <Text style={styles.note}>Coming soon with updated SDK</Text>
      </View>
    </View>
  );
  */
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  placeholder: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});