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
                  <Ionicons name={action.icon} size={20} color="#fff" />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
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
    elevation: 6,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  actionGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuickActions;
