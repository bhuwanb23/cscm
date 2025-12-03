import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const RequestHistory = () => {
  const [expandedCards, setExpandedCards] = useState(new Set());

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
      case 'dispatched':
        return 'cube';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#22C55E';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      case 'delivered':
      case 'dispatched':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request History</Text>
        <Text style={styles.headerSubtitle}>
          {STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.length} total requests
        </Text>
      </View>

      <ScrollView 
        style={styles.historyList} 
        showsVerticalScrollIndicator={false}
      >
        {STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.map((request, index) => {
          const isExpanded = expandedCards.has(request.id);
          const statusColor = getStatusColor(request.statusLabel);
          
          return (
            <View
              key={request.id}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={styles.historyCard}
                onPress={() => toggleCardExpansion(request.id)}
                activeOpacity={0.9}
              >
                <View style={styles.cardContent}>
                  <View style={styles.historyHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestId}>Request #{request.id}</Text>
                      <Text style={styles.requestDate}>{request.date}</Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <View 
                        style={[styles.statusBadge, { backgroundColor: statusColor }]}
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
                      </View>
                      
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
                                          request.priority === 'medium' ? '#F59E0B' : 
                                          request.priority === 'urgent' ? '#DC2626' : 
                                          request.priority === 'critical' ? '#F97316' : '#22C55E' }
                      ]} />
                      <Text style={styles.priorityText}>
                        {request.priority || 'normal'} priority
                      </Text>
                    </View>
                  </View>

                  {request.totalAmount && (
                    <View style={styles.amountRow}>
                      <Text style={styles.amountText}>Total: {request.totalAmount}</Text>
                    </View>
                  )}

                  {isExpanded && (
                    <View style={styles.expandedContent}>
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
                      
                      {request.supplier && (
                        <View style={styles.supplierSection}>
                          <Text style={styles.supplierTitle}>Supplier:</Text>
                          <Text style={styles.supplierText}>{request.supplier}</Text>
                        </View>
                      )}
                      
                      {request.deliveryDate && (
                        <View style={styles.deliverySection}>
                          <Text style={styles.deliveryTitle}>Delivery Date:</Text>
                          <Text style={styles.deliveryText}>{request.deliveryDate}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
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
  amountRow: {
    marginBottom: 8,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
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
    marginBottom: 8,
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
    marginBottom: 8,
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
  supplierSection: {
    marginBottom: 8,
  },
  supplierTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  supplierText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  deliverySection: {
    marginBottom: 4,
  },
  deliveryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deliveryText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default RequestHistory;