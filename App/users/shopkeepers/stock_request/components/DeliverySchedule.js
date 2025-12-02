import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const DeliverySchedule = ({ selectedDelivery, onDeliverySelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Schedule</Text>
      <View style={styles.deliveryGrid}>
        {STOCK_REQUEST_CONSTANTS.DELIVERY_OPTIONS.map((option) => {
          const isSelected = selectedDelivery === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.deliveryButton,
                isSelected && {
                  backgroundColor: option.activeColor,
                  borderColor: option.activeBorderColor,
                  borderWidth: 2,
                },
                !isSelected && {
                  backgroundColor: option.inactiveColor,
                  borderColor: option.inactiveBorderColor,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onDeliverySelect(option.id)}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={isSelected ? option.activeTextColor : option.inactiveTextColor}
                style={styles.deliveryIcon}
              />
              <View style={styles.deliveryInfo}>
                <Text
                  style={[
                    styles.deliveryText,
                    isSelected && { color: option.activeTextColor },
                    !isSelected && { color: option.inactiveTextColor },
                  ]}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    style={[
                      styles.deliveryDescription,
                      isSelected && { color: option.activeTextColor },
                      !isSelected && { color: option.inactiveTextColor },
                    ]}
                  >
                    {option.description}
                  </Text>
                )}
              </View>
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
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  deliveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  deliveryButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  deliveryIcon: {
    marginRight: 6,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  deliveryDescription: {
    fontSize: 10,
    opacity: 0.7,
  },
});

export default DeliverySchedule;