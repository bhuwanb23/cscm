import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ChannelsWarehouses = ({ channels, warehouses }) => {
  return (
    <View style={styles.connectionsSection}>
      {/* Channels */}
      <View style={styles.channelsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Channels</Text>
        </View>
        
        <View style={styles.channelsList}>
          {channels.map(channel => (
            <View key={channel.id} style={styles.channelItem}>
              <View style={styles.channelInfo}>
                <View style={styles.channelLogo}>
                  <Text style={styles.channelLogoText}>
                    {channel.name === 'Shopify' ? 'S' : 
                     channel.name === 'Amazon FBA' ? 'A' : 'W'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelSync}>Last sync: {channel.lastSync}</Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Warehouses */}
      <View style={styles.warehousesCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nodes</Text>
        </View>
        
        <View style={styles.warehousesList}>
          {warehouses.map(warehouse => (
            <View key={warehouse.id} style={styles.warehouseItem}>
              <View style={styles.warehouseHeader}>
                <View style={styles.warehouseLogo}>
                  <Text style={styles.warehouseLogoText}>📦</Text>
                </View>
                <View style={styles.warehouseLocation}>
                  <Text style={styles.locationText}>{warehouse.location}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.warehouseName}>{warehouse.name}</Text>
                <Text style={styles.capacityText}>Cap: {warehouse.capacity}%</Text>
              </View>
              <View style={styles.capacityBarContainer}>
                <View style={styles.capacityBarBackground}>
                  <View 
                    style={[
                      styles.capacityBarFill, 
                      { width: `${warehouse.capacity}%` }
                    ]}
                  ></View>
                </View>
              </View>
            </View>
          ))}
          
          <View style={styles.addWarehouseButton}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addWarehouseText}>Add Node</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  connectionsSection: {
    gap: 16,
    marginBottom: 16,
  },
  channelsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  channelsList: {
    gap: 12,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLogoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  channelSync: {
    fontSize: 12,
    color: '#6b7280',
  },
  chevronIcon: {
    fontSize: 20,
    color: '#9ca3af',
  },
  warehousesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  warehousesList: {
    gap: 16,
  },
  warehouseItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warehouseLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  warehouseLogoText: {
    fontSize: 16,
  },
  warehouseLocation: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationText: {
    fontSize: 10,
    color: '#6b7280',
  },
  warehouseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  capacityText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  capacityBarContainer: {
    width: '100%',
  },
  capacityBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  addWarehouseButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 128,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#9ca3af',
    marginBottom: 8,
  },
  addWarehouseText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default ChannelsWarehouses;