import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
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
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Shipments</Text>
          <Text style={styles.headerSubtitle}>Track and manage deliveries</Text>
        </View>
      </View>

      <View style={styles.content}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  headerContainer: {
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