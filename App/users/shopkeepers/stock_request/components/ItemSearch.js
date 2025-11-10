import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ItemSearch = ({ searchQuery, onSearchChange, filteredItems, onAddItem }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    filteredItems.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const animations = filteredItems.map((_, index) =>
      Animated.timing(itemAnims[index], {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      })
    );
    
    Animated.parallel(animations).start();
  }, [filteredItems]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <Text style={styles.title}>Search Items</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item, index) => (
            <Animated.View
              key={item.id}
              style={[
                styles.itemWrapper,
                {
                  opacity: itemAnims[index],
                  transform: [{
                    translateY: itemAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.itemCard}
              >
                <View style={styles.itemInfo}>
                  <View style={[styles.itemIcon, { backgroundColor: item.iconBgColor }]}>
                    <Ionicons name={item.icon} size={16} color={item.iconColor} />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onAddItem({ ...item, quantity: -1 })}
                  >
                    <Ionicons name="remove" size={12} color="#9CA3AF" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.currentQuantity || 0}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, styles.addButton]}
                    onPress={() => onAddItem({ ...item, quantity: 1 })}
                  >
                    <Ionicons name="add" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
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
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  itemsList: {
    maxHeight: 200,
  },
  itemWrapper: {
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  itemCategory: {
    fontSize: 10,
    color: '#6B7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quantityText: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ItemSearch;
