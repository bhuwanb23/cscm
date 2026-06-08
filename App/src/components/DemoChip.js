import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';

// Set to false once the 8 broken sub-agents (issues 1.3/1.4) are fixed
const DEMO_MODE = true;

const DemoChip = ({ style }) => {
  if (!DEMO_MODE) return null;

  return (
    <View style={[styles.chip, style]}>
      <Ionicons name="information-circle" size={14} color="#92400E" />
      <Text style={styles.label}>Demo data — backend not reachable</Text>
    </View>
  );
};

DemoChip.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
  },
});

export default DemoChip;
