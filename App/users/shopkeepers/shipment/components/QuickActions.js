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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {SHIPMENT_CONSTANTS.QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <Ionicons name={action.icon} size={20} color={action.color} />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default QuickActions;
