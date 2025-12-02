import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const SettingsIntegrations = ({ settingsIntegrations }) => {
  return (
    <CSCMCard title="Settings & Integrations">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Keys</Text>
        {settingsIntegrations.apiKeys.map((key) => (
          <View key={key.id} style={styles.keyItem}>
            <View style={styles.keyInfo}>
              <Text style={styles.keyName}>{key.name}</Text>
              <Text style={styles.keyStatus}>Status: {key.status}</Text>
            </View>
            <Text style={styles.lastUsed}>Last used: {key.lastUsed}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Integrations</Text>
        {settingsIntegrations.integrations.map((integration) => (
          <View key={integration.id} style={styles.integrationItem}>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>{integration.name}</Text>
              <View style={styles.integrationStatus}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: integration.status === 'connected' ? COLORS.success : COLORS.danger }
                ]} />
                <Text style={styles.statusText}>
                  {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
            <Text style={styles.lastSync}>Last sync: {integration.lastSync}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.notificationSettings}>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationLabel}>Email Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.slate, true: COLORS.indigo }}
              thumbColor={settingsIntegrations.notificationPreferences.email ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.slate}
              onValueChange={() => {}}
              value={settingsIntegrations.notificationPreferences.email}
            />
          </View>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationLabel}>SMS Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.slate, true: COLORS.indigo }}
              thumbColor={settingsIntegrations.notificationPreferences.sms ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.slate}
              onValueChange={() => {}}
              value={settingsIntegrations.notificationPreferences.sms}
            />
          </View>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationLabel}>Push Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.slate, true: COLORS.indigo }}
              thumbColor={settingsIntegrations.notificationPreferences.push ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.slate}
              onValueChange={() => {}}
              value={settingsIntegrations.notificationPreferences.push}
            />
          </View>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationLabel}>Slack Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.slate, true: COLORS.indigo }}
              thumbColor={settingsIntegrations.notificationPreferences.slack ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.slate}
              onValueChange={() => {}}
              value={settingsIntegrations.notificationPreferences.slack}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sync Controls</Text>
        <View style={styles.syncControls}>
          <View style={styles.syncInfo}>
            <Text style={styles.syncFrequency}>Sync Frequency: {settingsIntegrations.dataSync.frequency}</Text>
            <Text style={styles.lastSync}>Last sync: {settingsIntegrations.dataSync.lastSync}</Text>
          </View>
          <View style={styles.syncToggle}>
            <Text style={styles.toggleLabel}>Auto Sync</Text>
            <Switch
              trackColor={{ false: COLORS.slate, true: COLORS.indigo }}
              thumbColor={settingsIntegrations.dataSync.autoSync ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.slate}
              onValueChange={() => {}}
              value={settingsIntegrations.dataSync.autoSync}
            />
          </View>
        </View>
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
  keyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  keyStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 2,
  },
  lastUsed: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
  },
  integrationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  integrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
  },
  lastSync: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
  },
  notificationSettings: {
    // No additional styling needed
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  notificationLabel: {
    ...TYPOGRAPHY.body,
  },
  syncControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncInfo: {
    flex: 1,
  },
  syncFrequency: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleLabel: {
    ...TYPOGRAPHY.body,
    marginRight: 12,
  },
  syncToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsIntegrations;