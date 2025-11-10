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

const RecentDeliveries = ({ deliveries }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    deliveries.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      ...deliveries.map((_, index) =>
        Animated.timing(itemAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        })
      ),
    ];
    
    Animated.parallel(animations).start();
  }, [deliveries]);

  const handleViewAll = () => {
    console.log('View all deliveries pressed');
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={16} color="#3B82F6" />
            <Text style={styles.title}>Recent Deliveries</Text>
          </View>
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              style={styles.viewAllGradient}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.deliveriesList}>
          {deliveries.map((delivery, index) => (
            <Animated.View
              key={delivery.id}
              style={[
                styles.deliveryWrapper,
                {
                  opacity: itemAnims[index],
                  transform: [{
                    translateX: itemAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  }],
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.deliveryItem}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.deliveryIcon}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryId}>#{delivery.id}</Text>
                  <Text style={styles.deliveryTime}>{delivery.deliveredAt}</Text>
                </View>
                <View style={styles.itemCountContainer}>
                  <Text style={styles.itemCount}>{delivery.itemCount}</Text>
                  <Text style={styles.itemLabel}>items</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  viewAllText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deliveriesList: {
    gap: 6,
  },
  deliveryWrapper: {
    marginBottom: 2,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  deliveryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  deliveryTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemCountContainer: {
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
  },
  itemLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default RecentDeliveries;
