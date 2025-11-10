import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
import InventoryItem from './InventoryItem';

const InventoryList = ({ items, onQuickUpdate, onViewDetails }) => {
  const renderItem = ({ item }) => (
    <InventoryItem
      item={item}
      onQuickUpdate={onQuickUpdate}
      onViewDetails={onViewDetails}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 20, // Space for bottom navigation
  },
});

export default InventoryList;
