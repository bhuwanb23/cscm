import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfirmationModal = ({ isVisible, onClose, submittedRequest }) => {
  // Get delivery option details
  const getDeliveryOption = (deliveryId) => {
    const options = {
      asap: { label: 'ASAP (1-2 hours)', time: '1-2 hours', description: 'Highest priority delivery' },
      same_day: { label: 'Same Day', time: 'Today by closing', description: 'Delivered today by closing time' },
      tomorrow: { label: 'Tomorrow', time: 'Tomorrow', description: 'Next business day delivery' },
      this_week: { label: 'This Week', time: '3-5 business days', description: 'Delivery within 3-5 business days' },
      next_week: { label: 'Next Week', time: 'Next week', description: 'Scheduled for next week' },
    };
    return options[deliveryId] || options.same_day;
  };

  // Get priority details
  const getPriorityDetails = (priorityId) => {
    const priorities = {
      low: { label: 'Low', nextStep: 'Routine Processing', description: 'Routine restocking for non-essential items' },
      normal: { label: 'Normal', nextStep: 'Standard Review', description: 'Standard priority for regular inventory needs' },
      high: { label: 'High', nextStep: 'Priority Review', description: 'Important items needed within 2-3 days' },
      urgent: { label: 'Urgent', nextStep: 'Immediate Review', description: 'Critical items needed within 24 hours' },
      critical: { label: 'Critical', nextStep: 'Emergency Processing', description: 'Emergency restocking - out of stock items' },
    };
    return priorities[priorityId] || priorities.normal;
  };

  // Add safety checks for submittedRequest
  const deliveryInfo = submittedRequest && submittedRequest.delivery ? 
    getDeliveryOption(submittedRequest.delivery) : 
    getDeliveryOption('same_day');
    
  const priorityInfo = submittedRequest && submittedRequest.priority ? 
    getPriorityDetails(submittedRequest.priority) : 
    getPriorityDetails('normal');

  // Only show modal when there's a submitted request
  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
          </View>
          <Text style={styles.title}>Request Submitted Successfully!</Text>
          <Text style={styles.message}>
            Your stock request has been submitted and is now being processed. 
            You'll receive updates on the status via notifications.
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Estimated Processing:</Text>
              <Text style={styles.detailValue}>{deliveryInfo.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Reference Number:</Text>
              <Text style={styles.detailValue}>
                #{submittedRequest && submittedRequest.id ? submittedRequest.id : Math.floor(100000 + Math.random() * 900000)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Next Steps:</Text>
              <Text style={styles.detailValue}>{priorityInfo.nextStep}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Priority:</Text>
              <Text style={styles.detailValue}>{priorityInfo.label}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Delivery Option:</Text>
              <Text style={styles.detailValue}>{deliveryInfo.label}</Text>
            </View>
            
            {submittedRequest && submittedRequest.totalAmount && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Estimated Total:</Text>
                <Text style={styles.detailValue}>{submittedRequest.totalAmount}</Text>
              </View>
            )}
            
            {submittedRequest && submittedRequest.deliveryDate && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-number-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Delivery Date:</Text>
                <Text style={styles.detailValue}>{submittedRequest.deliveryDate}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>View Request History</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#D1FAE5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConfirmationModal;