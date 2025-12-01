import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ActionBar = ({ runScale, onStartAnalysis, status }) => {
  return (
    <View style={styles.actionBar}>
      <View style={styles.runWrapper}>
        <TouchableOpacity
          style={styles.runButtonTouchable}
          onPress={onStartAnalysis}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#2563EB', '#1E3A8A']}
            style={styles.runButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={status === 'running' ? 'flash' : 'play-circle'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.runText}>
              {status === 'running' ? '⚡ Running AI Analysis…' : 'Run Analysis'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRight}>
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportChip}>
            <Ionicons name="document-text-outline" size={14} color="#111827" />
            <Text style={styles.exportText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportChip}>
            <Ionicons name="grid-outline" size={14} color="#111827" />
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportChip}>
            <Ionicons name="sparkles-outline" size={14} color="#111827" />
            <Text style={styles.exportText}>AI Report</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filters:</Text>
          <Text style={styles.filterChip}>Last 30 days</Text>
          <Text style={styles.filterChip}>All channels</Text>
          <Text style={styles.filterChip}>All stores</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  runWrapper: {
    flexShrink: 0,
  },
  runButtonTouchable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    gap: 8,
  },
  runText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionRight: {
    flex: 1,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  exportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 4,
  },
  filterChip: {
    fontSize: 11,
    color: '#111827',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
});

export default ActionBar;