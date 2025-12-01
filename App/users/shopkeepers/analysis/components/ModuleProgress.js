import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ANALYSIS_MODULES } from '../constants';

const ModuleProgress = ({ moduleProgress }) => {
  return (
    <View style={styles.moduleRow}>
      {ANALYSIS_MODULES.map(m => (
        <View style={styles.moduleBlock} key={m.id}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleLabel}>{m.label}</Text>
            <Text style={styles.modulePercent}>
              {moduleProgress[m.id] || 0}
              %
            </Text>
          </View>
          <View style={styles.moduleBar}>
            <View
              style={[
                styles.moduleFill,
                { width: `${Math.max(moduleProgress[m.id] || 0, 5)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  moduleRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  moduleBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  moduleLabel: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  modulePercent: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  moduleBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  moduleFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
});

export default ModuleProgress;