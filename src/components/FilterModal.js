import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOCATIONS = [
  'All Locations',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
];

const PROPERTY_TYPES = [
  '1 RK',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4+ BHK',
  'PG',
  'Hostel',
  'Studio',
  'Shared Room',
];

const RENT_RANGES = [
  { label: 'Any Budget', min: 0, max: 0 },
  { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { label: '₹15,000 - ₹25,000', min: 15000, max: 25000 },
  { label: '₹25,000+', min: 25000, max: 999999 },
];

const AMENITIES = [
  'WiFi',
  'AC',
  'Parking',
  'Furnished',
  'Semi-Furnished',
  'Balcony',
  'Gym',
  'Swimming Pool',
  'Security',
  'Power Backup',
  'Water Supply',
  'Lift',
];

const PREFERENCES = [
  'Family',
  'Bachelor',
  'Students',
  'Working Professional',
  'Girls Only',
  'Boys Only',
  'Vegetarian',
  'Non-Vegetarian',
];

export default function FilterModal({ visible, onClose, onApply }) {
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedRentRange, setSelectedRentRange] = useState(RENT_RANGES[0]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [customMinRent, setCustomMinRent] = useState('');
  const [customMaxRent, setCustomMaxRent] = useState('');

  // Debug log
  console.log('FilterModal rendered, visible:', visible);
  
  if (!visible) {
    console.log('FilterModal not visible, returning null');
    return null;
  }
  
  console.log('FilterModal is visible, rendering content');

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const togglePreference = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  const handleApply = () => {
    const minRent = customMinRent ? parseInt(customMinRent) : selectedRentRange.min;
    const maxRent = customMaxRent ? parseInt(customMaxRent) : selectedRentRange.max;
    
    // Use custom location if provided, otherwise use selected location
    const finalLocation = customLocation.trim() || 
                         (selectedLocation === 'All Locations' ? '' : selectedLocation);
    
    onApply({
      location: finalLocation,
      types: selectedTypes,
      rentRange: { min: minRent, max: maxRent },
      amenities: selectedAmenities,
      preferences: selectedPreferences,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedLocation('All Locations');
    setCustomLocation('');
    setSelectedTypes([]);
    setSelectedRentRange(RENT_RANGES[0]);
    setSelectedAmenities([]);
    setSelectedPreferences([]);
    setCustomMinRent('');
    setCustomMaxRent('');
  };



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
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Location</Text>
              
              {/* Custom Location Input */}
              <View style={styles.customLocationContainer}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Enter area, locality, or landmark..."
                  value={customLocation}
                  onChangeText={(text) => {
                    setCustomLocation(text);
                    // Clear selected location when typing custom location
                    if (text.trim()) {
                      setSelectedLocation('All Locations');
                    }
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              {/* Predefined Locations */}
              <View style={styles.testContainer}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.chipButton,
                      selectedLocation === location && !customLocation.trim() && styles.chipButtonActive
                    ]}
                    onPress={() => {
                      setSelectedLocation(location);
                      // Clear custom location when selecting predefined location
                      if (location !== 'All Locations') {
                        setCustomLocation('');
                      }
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedLocation === location && !customLocation.trim() && styles.chipTextActive
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Type</Text>
              <View style={styles.typeGrid}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedTypes.includes(type) && styles.typeButtonActive
                    ]}
                    onPress={() => toggleType(type)}
                  >
                    <Text style={[
                      styles.typeText,
                      selectedTypes.includes(type) && styles.typeTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rent Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Rent Range</Text>
              <View style={styles.testContainer}>
                {RENT_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.label}
                    style={[
                      styles.chipButton,
                      selectedRentRange.label === range.label && styles.chipButtonActive
                    ]}
                    onPress={() => setSelectedRentRange(range)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedRentRange.label === range.label && styles.chipTextActive
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.customRentRow}>
                <Text style={styles.customRentLabel}>Custom Range:</Text>
                <View style={styles.customRentInputs}>
                  <TextInput
                    style={styles.rentInput}
                    placeholder="Min"
                    value={customMinRent}
                    onChangeText={setCustomMinRent}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rentSeparator}>-</Text>
                  <TextInput
                    style={styles.rentInput}
                    placeholder="Max"
                    value={customMaxRent}
                    onChangeText={setCustomMaxRent}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Amenities Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityChip,
                      selectedAmenities.includes(amenity) && styles.amenityChipActive
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <Text style={[
                      styles.amenityText,
                      selectedAmenities.includes(amenity) && styles.amenityTextActive
                    ]}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Tenant Preferences</Text>
              <View style={styles.amenitiesGrid}>
                {PREFERENCES.map((preference) => (
                  <TouchableOpacity
                    key={preference}
                    style={[
                      styles.amenityChip,
                      selectedPreferences.includes(preference) && styles.amenityChipActive
                    ]}
                    onPress={() => togglePreference(preference)}
                  >
                    <Text style={[
                      styles.amenityText,
                      selectedPreferences.includes(preference) && styles.amenityTextActive
                    ]}>
                      {preference}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
  },
  locationOptionActive: {
    backgroundColor: '#F3E8FF',
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationTextActive: {
    color: '#9333EA',
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#9333EA',
  },
  typeText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#9333EA',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#9333EA',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  horizontalScroll: {
    marginBottom: 8,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#9333EA',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#9333EA',
    fontWeight: '600',
  },
  customRentRow: {
    marginTop: 16,
  },
  customRentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  customRentInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  rentSeparator: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amenityChipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#9333EA',
  },
  amenityText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  amenityTextActive: {
    color: '#9333EA',
    fontWeight: '600',
  },
  testContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customLocationContainer: {
    marginBottom: 16,
  },
  locationInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
