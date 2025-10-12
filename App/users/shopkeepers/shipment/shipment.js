import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
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
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        renderItem={renderShipmentItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default Shipment;
