import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const PrioritySelector = ({ selectedPriority, onPrioritySelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Priority Level</Text>
      <View style={styles.priorityOptions}>
        {STOCK_REQUEST_CONSTANTS.PRIORITY_LEVELS.map((priority) => {
          const isSelected = selectedPriority === priority.id;
          return (
            <TouchableOpacity
              key={priority.id}
              style={[
                styles.priorityButton,
                isSelected && {
                  backgroundColor: priority.activeColor,
                  borderColor: priority.activeBorderColor,
                  borderWidth: 2,
                },
                !isSelected && {
                  backgroundColor: priority.inactiveColor,
                  borderColor: priority.inactiveBorderColor,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onPrioritySelect(priority.id)}
            >
              <Ionicons
                name={priority.icon}
                size={16}
                color={isSelected ? priority.activeTextColor : priority.inactiveTextColor}
                style={styles.priorityIcon}
              />
              <Text
                style={[
                  styles.priorityText,
                  isSelected && { color: priority.activeTextColor },
                  !isSelected && { color: priority.inactiveTextColor },
                ]}
              >
                {priority.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default PrioritySelector;
