import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHIPMENT_CONSTANTS } from '../constants';

const QuickActions = () => {
  const handlePress = (action, index) => {
    switch (action.id) {
      case 'scan-barcode':
        console.log('Scanning barcode...');
        break;
      case 'photo-upload':
        console.log('Uploading photo...');
        break;
      case 'add-note':
        console.log('Adding note...');
        break;
      case 'contact-driver':
        console.log('Contacting driver...');
        break;
      default:
        console.log('Quick action pressed:', action.title);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <Text style={styles.title}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {SHIPMENT_CONSTANTS.QUICK_ACTIONS.map((action, index) => (
            <View
              key={action.id}
              style={styles.actionWrapper}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePress(action, index)}
                activeOpacity={0.9}
              >
                <View
                  style={[styles.actionGradient, { backgroundColor: action.color }]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={action.icon} size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionText}>{action.title}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionWrapper: {
    flex: 1,
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default QuickActions;