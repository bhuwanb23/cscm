import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import InventoryItem from './InventoryItem';

const InventoryList = ({ items, onQuickUpdate, onViewDetails, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
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
    paddingBottom: 10, // Reduced space for bottom navigation
  },
});

export default InventoryList;
