import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QuickUpdateModal = ({ visible, item, onClose, onUpdate }) => {
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '0');

  const handleUpdate = () => {
    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }
    onUpdate(item.id, newQuantity);
    onClose();
  };

  const handleReportDamage = () => {
    Alert.alert(
      'Report Damage',
      'Are you sure you want to report this item as damaged?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => onUpdate(item.id, item.quantity - 1) },
      ]
    );
  };

  const handleMarkExpired = () => {
    Alert.alert(
      'Mark as Expired',
      'Are you sure you want to mark this item as expired?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Expired', onPress: () => onUpdate(item.id, item.quantity, 'expired') },
      ]
    );
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Stock</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Enter quantity"
              />
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.damageButton} onPress={handleReportDamage}>
                <Ionicons name="warning" size={16} color="#DC2626" />
                <Text style={styles.damageButtonText}>Report Damage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.expiryButton} onPress={handleMarkExpired}>
                <Ionicons name="time" size={16} color="#EA580C" />
                <Text style={styles.expiryButtonText}>Mark Expired</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.updateButtonText}>Update Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  damageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 8,
  },
  damageButtonText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  expiryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FED7AA',
    borderRadius: 8,
    gap: 8,
  },
  expiryButtonText: {
    color: '#EA580C',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default QuickUpdateModal;
