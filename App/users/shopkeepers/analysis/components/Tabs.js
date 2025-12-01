import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ANALYSIS_TABS } from '../constants';

const Tabs = ({ activeTab, onTabChange }) => {
  const renderTabPill = (tab) => {
    const isActive = tab === activeTab;
    return (
      <TouchableOpacity
        key={tab}
        style={styles.tabPillWrapper}
        onPress={() => onTabChange(tab)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isActive ? ['#2563EB', '#1E40AF'] : ['#F3F4F6', '#E5E7EB']}
          style={styles.tabPill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
            {tab}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsRow}
    >
      {ANALYSIS_TABS.map((tab) => renderTabPill(tab))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  tabPillWrapper: {
    marginRight: 6,
  },
  tabPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
});

export default Tabs;