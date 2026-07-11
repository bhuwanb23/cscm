import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DriverInfo = ({ driverInfo, onEdit, isEditing, onSave, onCancel }) => {
  const [localInfo, setLocalInfo] = useState(driverInfo);

  const handleChange = (field, value) => {
    setLocalInfo(prev => ({ ...prev, [field]: value }));
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

  const renderField = (label, field, options = {}) => (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={localInfo[field]}
          onChangeText={(v) => handleChange(field, v)}
          placeholder={label}
          keyboardType={options.keyboardType || 'default'}
        />
      ) : (
        <Text style={styles.value}>{driverInfo[field]}</Text>
      )}
    </View>
  );

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="person-circle-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Driver Information</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity onPress={onEdit}>
              <Ionicons name="create-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoGrid}>
          {renderField('License Number', 'licenseNumber')}
          {renderField('License Expiry', 'licenseExpiry')}
          {renderField('Phone Number', 'phone', { keyboardType: 'phone-pad' })}
          {renderField('Emergency Contact', 'emergencyContact')}
          {renderField('Years of Experience', 'experience')}
          {renderField('Preferred Routes', 'preferredRoutes')}
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoGrid: {
    padding: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
  },
  input: {
    fontSize: 14,
    color: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default DriverInfo;
