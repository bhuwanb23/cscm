import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

const BusinessInfo = ({ businessInfo, onEdit, isEditing, onFieldChange, onSave, onCancel }) => {
  const [localInfo, setLocalInfo] = useState(businessInfo);

  const handleChange = (field, value) => {
    const updated = { ...localInfo, [field]: value };
    setLocalInfo(updated);
    if (onFieldChange) onFieldChange(field, value);
  };

  const handleSave = () => {
    Alert.alert(
      'Save Changes',
      'Are you sure you want to save these changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => onSave(localInfo) },
      ]
    );
  };

  if (isEditing) {
    return (
      <View style={styles.businessInfoSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Edit Business Info</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={localInfo.businessName}
              onChangeText={(v) => handleChange('businessName', v)}
              placeholder="Business name"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                value={localInfo.contactPerson}
                onChangeText={(v) => handleChange('contactPerson', v)}
                placeholder="Contact name"
              />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={localInfo.phone}
                onChangeText={(v) => handleChange('phone', v)}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={localInfo.email}
              onChangeText={(v) => handleChange('email', v)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Headquarters Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={localInfo.address}
              onChangeText={(v) => handleChange('address', v)}
              placeholder="Business address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.businessInfoSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Business Info</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{businessInfo.businessName}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>Contact Person</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{businessInfo.contactPerson}</Text>
            </View>
          </View>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{businessInfo.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{businessInfo.email}</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Headquarters Address</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Text style={styles.textAreaText}>{businessInfo.address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  businessInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  editButton: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4f46e5',
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputText: {
    fontSize: 14,
    color: '#1f2937',
  },
  textAreaContainer: {
    minHeight: 60,
  },
  textAreaText: {
    fontSize: 14,
    color: '#1f2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default BusinessInfo;
