import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const InventoryMeshStatus = ({ inventoryMeshStatus }) => {
  return (
    <CSCMCard title="Inventory Mesh Status">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Visualization</Text>
        <View style={styles.networkContainer}>
          <View style={styles.nodeCenter}>
            <Ionicons name="storefront" size={32} color={COLORS.indigo} />
            <Text style={styles.nodeLabel}>Shop</Text>
          </View>
          <View style={styles.connections}>
            <View style={styles.connectionLine} />
            <View style={styles.connectedNodes}>
              <View style={styles.node}>
                <Ionicons name="home" size={24} color={COLORS.success} />
                <Text style={styles.nodeLabel}>Warehouse</Text>
              </View>
              <View style={styles.node}>
                <Ionicons name="globe" size={24} color={COLORS.success} />
                <Text style={styles.nodeLabel}>Marketplace</Text>
              </View>
              <View style={styles.node}>
                <Ionicons name="business" size={24} color={COLORS.success} />
                <Text style={styles.nodeLabel}>Distributor</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active AI Agents</Text>
        <View style={styles.agentsContainer}>
          {inventoryMeshStatus.activeAgents.map((agent, index) => (
            <View key={index} style={styles.agentItem}>
              <View style={styles.agentIcon}>
                <Ionicons name="robot" size={16} color={COLORS.indigo} />
              </View>
              <Text style={styles.agentName}>{agent.name}</Text>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: agent.status === 'active' ? COLORS.success : COLORS.danger }
              ]} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.syncContainer}>
          <View style={styles.syncItem}>
            <Text style={styles.syncLabel}>{inventoryMeshStatus.syncStatus.pos.name}</Text>
            <View style={styles.syncStatus}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.statusText}>Synced</Text>
              <Text style={styles.lastSync}>({inventoryMeshStatus.syncStatus.pos.lastSync})</Text>
            </View>
          </View>
          <View style={styles.syncItem}>
            <Text style={styles.syncLabel}>{inventoryMeshStatus.syncStatus.ecommerce.name}</Text>
            <View style={styles.syncStatus}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.statusText}>Synced</Text>
              <Text style={styles.lastSync}>({inventoryMeshStatus.syncStatus.ecommerce.lastSync})</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {inventoryMeshStatus.alerts.map((alert) => (
          <View key={alert.id} style={styles.alertItem}>
            <View style={styles.alertIcon}>
              <Ionicons 
                name={
                  alert.type === 'low-stock' ? 'alert' : 
                  alert.type === 'high-risk' ? 'warning' : 
                  'information-circle'
                } 
                size={16} 
                color={
                  alert.severity === 'warning' ? COLORS.warning : 
                  alert.severity === 'danger' ? COLORS.danger : 
                  COLORS.indigo
                } 
              />
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
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
  networkContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  nodeCenter: {
    alignItems: 'center',
    marginBottom: 30,
  },
  nodeLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    fontWeight: '600',
  },
  connections: {
    alignItems: 'center',
  },
  connectionLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.slateDark,
  },
  connectedNodes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  node: {
    alignItems: 'center',
  },
  agentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slateLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  agentIcon: {
    marginRight: 6,
  },
  agentName: {
    ...TYPOGRAPHY.caption,
    marginRight: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncContainer: {
    // No additional styling needed
  },
  syncItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  syncLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: 4,
    marginRight: 4,
  },
  lastSync: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertMessage: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
});

export default InventoryMeshStatus;