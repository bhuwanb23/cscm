import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SETTINGS_OPTIONS } from '../constants/profileConstants';

const SettingsSection = () => {
  return (
    <View style={styles.settingsSection}>
      <View style={styles.settingsCard}>
        {SETTINGS_OPTIONS.map((option, index) => (
          <React.Fragment key={option.id}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Text style={styles.settingsIconText}>{option.icon}</Text>
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>{option.title}</Text>
                <Text style={styles.settingsSubtitle}>{option.subtitle}</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
            
            {index < SETTINGS_OPTIONS.length - 1 && (
              <View style={styles.divider}></View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsSection: {
    marginBottom: 16,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsIconText: {
    fontSize: 16,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  chevronIcon: {
    fontSize: 20,
    color: '#9ca3af',
  },
});

export default SettingsSection;