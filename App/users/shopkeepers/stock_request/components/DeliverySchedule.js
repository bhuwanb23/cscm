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
              <Text
                style={[
                  styles.deliveryText,
                  isSelected && { color: option.activeTextColor },
                  !isSelected && { color: option.inactiveTextColor },
                ]}
              >
                {option.label}
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
  deliveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  deliveryButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  deliveryIcon: {
    marginRight: 6,
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default DeliverySchedule;
