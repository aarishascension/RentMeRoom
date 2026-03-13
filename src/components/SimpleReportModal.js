import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { blockUser, reportUser } from '../services/moderation';

export default function SimpleReportModal({ 
  visible, 
  onClose, 
  targetId,
  targetName = 'User',
  onUserBlocked, // Add callback for when user is blocked
}) {
  const [selectedReason, setSelectedReason] = useState('');

  // Removed excessive debug logging that was causing performance issues

  const reasons = [
    { value: 'spam', label: 'Spam or unwanted content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'fake', label: 'Fake or misleading listing' },
    { value: 'other', label: 'Other' },
  ];

  const handleBlock = async () => {
    Alert.alert(
      'Block User',
      `Block ${targetName}? You won't see their posts anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(targetId, 'Blocked from modal');
              Alert.alert('Success', `${targetName} has been blocked.`);
              onClose();
              // Notify parent component that user was blocked
              if (onUserBlocked) {
                onUserBlocked(targetId);
              }
            } catch (error) {
              console.error('Block error:', error);
              Alert.alert('Error', error.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    
    try {
      await reportUser(targetId, selectedReason, `Report from modal: ${selectedReason}`);
      Alert.alert('Success', 'Report submitted successfully. We will review it shortly.');
      setSelectedReason(''); // Reset selection
      onClose();
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Error', error.message || 'Failed to submit report');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Report {targetName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Block Button */}
            <TouchableOpacity style={styles.blockButton} onPress={handleBlock}>
              <Ionicons name="ban" size={20} color="#DC2626" />
              <Text style={styles.blockText}>Block {targetName}</Text>
            </TouchableOpacity>

            <Text style={styles.separator}>OR</Text>

            {/* Report Reasons */}
            <Text style={styles.sectionTitle}>Select a reason:</Text>

            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reason,
                  selectedReason === reason.value && styles.reasonSelected
                ]}
                onPress={() => {
                  setSelectedReason(reason.value);
                }}
              >
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
              <Text style={styles.reportText}>Submit Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  blockText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
  },
  separator: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reason: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonSelected: {
    backgroundColor: '#F3E8FF',
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  reasonText: {
    fontSize: 15,
  },
  reportButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  reportText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});