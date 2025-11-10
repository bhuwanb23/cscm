import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const fadeAnims = useRef(
    STOCK_REQUEST_CONSTANTS.TABS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = STOCK_REQUEST_CONSTANTS.TABS.map((_, index) =>
      Animated.timing(fadeAnims[index], {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.parallel(animations).start();
  }, []);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      style={styles.container}
    >
      {STOCK_REQUEST_CONSTANTS.TABS.map((tab, index) => (
        <Animated.View
          key={tab.id}
          style={[
            styles.tabWrapper,
            {
              opacity: fadeAnims[index],
              transform: [{
                scale: fadeAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            }
          ]}
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
        </Animated.View>
      ))}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
