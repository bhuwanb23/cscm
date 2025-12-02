import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const BusinessInfo = ({ businessInfo, onEdit }) => {
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
});

export default BusinessInfo;