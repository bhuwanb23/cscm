import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ShipmentCard from './ShipmentCard';

const ShipmentList = ({ shipments, onActionPress, getStatusStyle }) => {
  return (
    <FlatList
      data={shipments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ShipmentCard
          shipment={item}
          onActionPress={onActionPress}
          getStatusStyle={getStatusStyle}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});

export default ShipmentList;
