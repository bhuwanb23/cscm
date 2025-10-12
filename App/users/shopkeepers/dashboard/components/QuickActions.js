import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_CONSTANTS } from '../constants';

const QuickActions = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {DASHBOARD_CONSTANTS.QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            activeOpacity={0.8}
          >
            <Ionicons name={action.icon} size={20} color="#fff" />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuickActions;
