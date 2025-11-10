import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Animated,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useShipmentData } from './hooks/useShipmentData';
import FilterTabs from './components/FilterTabs';
import MapToggle from './components/MapToggle';
import MapView from './components/MapView';
import ShipmentCard from './components/ShipmentCard';
import QuickActions from './components/QuickActions';
import RecentDeliveries from './components/RecentDeliveries';

const Shipment = () => {
  const {
    shipments,
    activeFilter,
    setActiveFilter,
    isMapViewEnabled,
    setIsMapViewEnabled,
    recentDeliveries,
    getStatusStyle,
    confirmDelivery,
  } = useShipmentData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleActionPress = (shipment) => {
    if (shipment.actionText === 'Confirm Delivery') {
      confirmDelivery(shipment.id);
    } else {
      // Handle other actions like "View Details", "Track Live"
      console.log(`Action pressed for shipment ${shipment.id}: ${shipment.actionText}`);
    }
  };

  const renderHeader = () => (
    <View>
      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <MapToggle
        isEnabled={isMapViewEnabled}
        onToggle={() => setIsMapViewEnabled(!isMapViewEnabled)}
      />

      {isMapViewEnabled && (
        <MapView activeShipmentsCount={shipments.length} />
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      <QuickActions />
      <RecentDeliveries deliveries={recentDeliveries} />
    </View>
  );

  const renderShipmentItem = ({ item }) => (
    <ShipmentCard
      shipment={item}
      onActionPress={handleActionPress}
      getStatusStyle={getStatusStyle}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Shipments</Text>
          <Text style={styles.headerSubtitle}>Track and manage deliveries</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          renderItem={renderShipmentItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#DBEAFE',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default Shipment;
