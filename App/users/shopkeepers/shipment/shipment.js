import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useShipmentData } from './hooks/useShipmentData';
import FilterTabs from './components/FilterTabs';
import MapToggle from './components/MapToggle';
import MapView from './components/MapView';
import ShipmentList from './components/ShipmentList';
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

  const handleActionPress = (shipment) => {
    if (shipment.actionText === 'Confirm Delivery') {
      confirmDelivery(shipment.id);
    } else {
      // Handle other actions like "View Details", "Track Live"
      console.log(`Action pressed for shipment ${shipment.id}: ${shipment.actionText}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        <ShipmentList
          shipments={shipments}
          onActionPress={handleActionPress}
          getStatusStyle={getStatusStyle}
        />

        <QuickActions />

        <RecentDeliveries deliveries={recentDeliveries} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default Shipment;
