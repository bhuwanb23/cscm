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
      <View style={styles.gradientContainer}>
        <Text style={styles.title}>Priority Level</Text>
        <View style={styles.priorityOptions}>
          {STOCK_REQUEST_CONSTANTS.PRIORITY_LEVELS.map((priority) => {
            const isSelected = selectedPriority === priority.id;
            return (
              <View
                key={priority.id}
                style={styles.buttonWrapper}
              >
                <TouchableOpacity
                  style={styles.priorityButton}
                  onPress={() => onPrioritySelect(priority.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <View 
                      style={[styles.activeButton, { 
                        backgroundColor: priority.activeColor,
                        borderColor: priority.activeBorderColor,
                        borderWidth: 1,
                      }]}
                    >
                      <Ionicons
                        name={priority.icon}
                        size={14}
                        color={priority.activeTextColor}
                        style={styles.priorityIcon}
                      />
                      <View style={styles.priorityInfo}>
                        <Text style={[styles.priorityText, { color: priority.activeTextColor }]}>
                          {priority.label}
                        </Text>
                        {priority.description && (
                          <Text style={[styles.priorityDescription, { color: priority.activeTextColor }]}>
                            {priority.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.inactiveButton, { backgroundColor: priority.inactiveColor }]}>
                      <Ionicons
                        name={priority.icon}
                        size={14}
                        color={priority.inactiveTextColor}
                        style={styles.priorityIcon}
                      />
                      <View style={styles.priorityInfo}>
                        <Text style={[styles.priorityText, { color: priority.inactiveTextColor }]}>
                          {priority.label}
                        </Text>
                        {priority.description && (
                          <Text style={[styles.priorityDescription, { color: priority.inactiveTextColor }]}>
                            {priority.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
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
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  buttonWrapper: {
    width: '32%',
    marginBottom: 6,
  },
  priorityButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  inactiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  priorityIcon: {
    marginRight: 4,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 8,
    opacity: 0.7,
  },
});

export default PrioritySelector;