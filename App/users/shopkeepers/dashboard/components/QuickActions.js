import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_CONSTANTS } from '../constants';

const QuickActions = () => {
  const scaleAnims = useRef(
    DASHBOARD_CONSTANTS.QUICK_ACTIONS.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Start from visible state with subtle entrance animation
    scaleAnims.forEach((anim, index) => {
      anim.setValue(0.98);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePress = (index) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {DASHBOARD_CONSTANTS.QUICK_ACTIONS.map((action, index) => (
          <Animated.View
            key={action.id}
            style={[
              styles.actionWrapper,
              {
                transform: [
                  {
                    scale: scaleAnims[index],
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.9}
              onPress={() => handlePress(index)}
            >
              <LinearGradient
                colors={[action.color, `${action.color}CC`]}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={action.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionWrapper: {
    flex: 1,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  actionGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuickActions;