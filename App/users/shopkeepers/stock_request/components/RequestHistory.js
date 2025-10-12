import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const RequestHistory = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
        {STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY.map((request) => (
          <View key={request.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.requestId}>Request #{request.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: request.statusBgColor }]}>
                <Text style={[styles.statusText, { color: request.statusColor }]}>
                  {request.statusLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.requestDate}>{request.date}</Text>
            <View style={styles.itemsList}>
              {request.items.map((item, index) => (
                <Text key={index} style={styles.itemText}>
                  • {item.name} × {item.quantity}
                </Text>
              ))}
            </View>
          </View>
        ))}
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
  historyList: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemsList: {
    gap: 2,
  },
  itemText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default RequestHistory;
