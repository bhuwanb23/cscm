import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const ShopInformation = ({ shopInformation }) => {
  return (
    <CSCMCard title="Shop Information">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{shopInformation.description}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Size</Text>
        <View style={styles.businessInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Revenue</Text>
            <Text style={styles.infoValue}>{shopInformation.businessSize.revenue}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>SKU Count</Text>
            <Text style={styles.infoValue}>{shopInformation.businessSize.skuCount}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Daily Orders</Text>
            <Text style={styles.infoValue}>{shopInformation.businessSize.dailyOrders}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Channels Connected</Text>
        <View style={styles.channelsContainer}>
          {shopInformation.channels.map((channel, index) => (
            <View key={index} style={styles.channelItem}>
              <Ionicons 
                name={channel.connected ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={channel.connected ? COLORS.success : COLORS.danger} 
              />
              <Text style={[
                styles.channelName, 
                { color: channel.connected ? COLORS.charcoal : COLORS.slateDark }
              ]}>
                {channel.name}
              </Text>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: channel.connected ? COLORS.success : COLORS.danger }
              ]} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Warehouses</Text>
        {shopInformation.warehouses.map((warehouse, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons name="business" size={16} color={COLORS.indigo} />
            <Text style={styles.listItemText}>{warehouse}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fulfillment Partners</Text>
        {shopInformation.fulfillmentPartners.map((partner, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons name="cube" size={16} color={COLORS.indigo} />
            <Text style={styles.listItemText}>{partner}</Text>
          </View>
        ))}
      </View>
    </CSCMCard>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginBottom: 12,
  },
  description: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  businessInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    marginRight: 10,
  },
  infoLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
    marginBottom: 4,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  channelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slateLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  channelName: {
    ...TYPOGRAPHY.caption,
    marginLeft: 6,
    marginRight: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemText: {
    ...TYPOGRAPHY.body,
    marginLeft: 8,
  },
});

export default ShopInformation;