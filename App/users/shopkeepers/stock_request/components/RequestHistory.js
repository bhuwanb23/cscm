import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const RequestHistory = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(
    STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      ...STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.map((_, index) =>
        Animated.timing(cardAnims[index], {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        })
      ),
    ];
    
    Animated.parallel(animations).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const toggleCardExpansion = (requestId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      case 'delivered':
        return 'cube';
      default:
        return 'help-circle';
    }
  };

  const getStatusGradient = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return ['#22C55E', '#16A34A'];
      case 'pending':
        return ['#F59E0B', '#D97706'];
      case 'rejected':
        return ['#EF4444', '#DC2626'];
      case 'delivered':
        return ['#3B82F6', '#1E40AF'];
      default:
        return ['#6B7280', '#4B5563'];
    }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request History</Text>
        <Text style={styles.headerSubtitle}>
          {STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.length} total requests
        </Text>
      </View>

      <ScrollView 
        style={styles.historyList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.map((request, index) => {
          const isExpanded = expandedCards.has(request.id);
          const statusGradient = getStatusGradient(request.statusLabel);
          
          return (
            <Animated.View
              key={request.id}
              style={[
                styles.cardWrapper,
                {
                  opacity: cardAnims[index],
                  transform: [{
                    translateY: cardAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.historyCard}
                onPress={() => toggleCardExpansion(request.id)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.cardGradient}
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestId}>Request #{request.id}</Text>
                      <Text style={styles.requestDate}>{request.date}</Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <LinearGradient
                        colors={statusGradient}
                        style={styles.statusBadge}
                      >
                        <Ionicons 
                          name={getStatusIcon(request.statusLabel)} 
                          size={12} 
                          color="#FFFFFF" 
                          style={styles.statusIcon}
                        />
                        <Text style={styles.statusText}>
                          {request.statusLabel}
                        </Text>
                      </LinearGradient>
                      
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={16} 
                        color="#6B7280" 
                        style={styles.expandIcon}
                      />
                    </View>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.itemCount}>
                      <Ionicons name="cube-outline" size={14} color="#6B7280" />
                      <Text style={styles.itemCountText}>
                        {request.items.length} items
                      </Text>
                    </View>
                    
                    <View style={styles.priorityIndicator}>
                      <View style={[
                        styles.priorityDot, 
                        { backgroundColor: request.priority === 'high' ? '#EF4444' : 
                                          request.priority === 'medium' ? '#F59E0B' : '#22C55E' }
                      ]} />
                      <Text style={styles.priorityText}>
                        {request.priority || 'normal'} priority
                      </Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <Animated.View style={styles.expandedContent}>
                      <View style={styles.itemsHeader}>
                        <Text style={styles.itemsTitle}>Requested Items:</Text>
                      </View>
                      <View style={styles.itemsList}>
                        {request.items.map((item, itemIndex) => (
                          <View key={itemIndex} style={styles.itemRow}>
                            <View style={styles.itemDot} />
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                          </View>
                        ))}
                      </View>
                      
                      {request.notes && (
                        <View style={styles.notesSection}>
                          <Text style={styles.notesTitle}>Notes:</Text>
                          <Text style={styles.notesText}>{request.notes}</Text>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyList: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  historyCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expandIcon: {
    marginLeft: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCountText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 4,
  },
  itemsHeader: {
    marginBottom: 6,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 14,
  },
});

export default RequestHistory;
