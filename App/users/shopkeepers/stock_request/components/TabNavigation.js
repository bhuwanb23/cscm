import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      {STOCK_REQUEST_CONSTANTS.TABS.map((tab) => (
        <View
          key={tab.id}
          style={styles.tabWrapper}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
          >
            {activeTab === tab.id ? (
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.activeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.activeTabText}>
                  {tab.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Text style={styles.tabText}>
                  {tab.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  inactiveTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TabNavigation;