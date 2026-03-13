import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { blockUser, getReportReasons, reportPost, reportUser } from '../services/moderation';

export default function ReportModal({ 
  visible, 
  onClose, 
  targetType = 'user', // 'user' or 'post'
  targetId,
  targetName = 'User',
  postId = null 
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = getReportReasons() || [
    { value: 'spam', label: 'Spam or unwanted content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'fake_listing', label: 'Fake or misleading listing' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'other', label: 'Other' },
  ];
  console.log('🐛 Report reasons:', reportReasons);
  console.log('🐛 Selected reason:', selectedReason);

  const handleSubmit = async () => {
    console.log('🐛 HandleSubmit called:', { selectedReason, description: description.trim() });
    
    if (!selectedReason) {
      console.log('🐛 No reason selected, showing alert');
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (!description.trim()) {
      console.log('🐛 No description provided, showing alert');
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🐛 Submitting report:', { targetType, targetId, postId });
      
      if (targetType === 'user') {
        await reportUser(targetId, selectedReason, description);
      } else {
        await reportPost(postId, selectedReason, description);
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it shortly.',
        [{ text: 'OK', onPress: onClose }]
      );
      
      // Reset form
      setSelectedReason('');
      setDescription('');
    } catch (error) {
      console.error('🐛 Report submission error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockUser = async () => {
    console.log('🐛 HandleBlockUser called:', { targetType, targetId, targetName });
    
    if (targetType !== 'user') {
      console.log('🐛 Not a user, blocking disabled');
      return;
    }

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${targetName}? You won't see their posts or messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🐛 Blocking user:', targetId);
              await blockUser(targetId, 'Blocked from report modal');
              Alert.alert('User Blocked', `${targetName} has been blocked successfully.`);
              onClose();
            } catch (error) {
              console.error('🐛 Block user error:', error);
              Alert.alert('Error', error.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  if (!visible) {
    console.log('🐛 ReportModal not visible, returning null');
    return null;
  }

  console.log('🐛 ReportModal rendering with visible=true');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Report {targetType === 'user' ? targetName : 'Post'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {/* Block Section - Show First for Users */}
            {targetType === 'user' && (
              <View style={styles.blockSection}>
                <Text style={styles.blockSectionTitle}>Quick Action</Text>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={handleBlockUser}
                >
                  <Ionicons name="ban" size={20} color="#DC2626" />
                  <Text style={styles.blockButtonText}>Block {targetName}</Text>
                </TouchableOpacity>
                <Text style={styles.blockHelpText}>
                  Block this user to hide their posts and prevent messages
                </Text>
              </View>
            )}

            {/* Separator */}
            {targetType === 'user' && (
              <View style={styles.separator}>
                <Text style={styles.separatorText}>OR</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Report this {targetType}</Text>
            <Text style={styles.sectionTitle}>Why are you reporting this {targetType}?</Text>
            
            {/* Debug info */}
            {selectedReason && (
              <Text style={styles.debugText}>✅ Selected: {selectedReason}</Text>
            )}
            
            {/* Test button for debugging */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                console.log('🐛 Test button pressed, setting reason to spam');
                setSelectedReason('spam');
              }}
            >
              <Text style={styles.testButtonText}>🧪 Test: Select Spam</Text>
            </TouchableOpacity>
            
            {reportReasons.map((reason, index) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.value && styles.reasonOptionSelected
                ]}
                onPress={() => {
                  console.log('🐛 Reason selected:', reason.value, 'at index:', index);
                  setSelectedReason(reason.value);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioButton,
                  selectedReason === reason.value && styles.radioButtonSelected
                ]}
                pointerEvents="none"
                >
                  {selectedReason === reason.value && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason.value && styles.reasonTextSelected
                ]}
                pointerEvents="none"
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Additional Details</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Please provide more details about the issue..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    marginTop: 40,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 4,
  },
  testButton: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  testButtonText: {
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    minHeight: 50,
  },
  reasonOptionSelected: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#9333EA',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#9333EA',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9333EA',
  },
  reasonText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#9333EA',
    fontWeight: '500',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  blockSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  blockSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  blockButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  blockHelpText: {
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  separator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});