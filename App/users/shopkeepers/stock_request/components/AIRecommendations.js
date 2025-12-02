import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const AIRecommendations = ({ onAddRecommendation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="hardware-chip-outline" size={20} color="#9333EA" />
        <Text style={styles.title}>AI Recommendations</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendationsContainer}
      >
        {STOCK_REQUEST_CONSTANTS.AI_RECOMMENDATIONS.map((recommendation) => (
          <View key={recommendation.id} style={styles.recommendationCard}>
            <View style={styles.recommendationContent}>
              <View style={styles.recommendationInfo}>
                <View style={[styles.iconContainer, { backgroundColor: recommendation.iconBgColor }]}>
                  <Ionicons 
                    name={recommendation.icon} 
                    size={20} 
                    color={recommendation.iconColor} 
                  />
                </View>
                <View style={styles.recommendationDetails}>
                  <Text style={styles.recommendationName}>{recommendation.name}</Text>
                  <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
                  {recommendation.reason && (
                    <Text style={styles.recommendationReason}>{recommendation.reason}</Text>
                  )}
                  {recommendation.price && (
                    <Text style={styles.recommendationPrice}>{recommendation.price}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddRecommendation(recommendation)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {recommendation.supplier && (
              <Text style={styles.recommendationSupplier}>Supplier: {recommendation.supplier}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  recommendationsContainer: {
    paddingRight: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 220,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationDetails: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  recommendationReason: {
    fontSize: 10,
    color: '#9333EA',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  recommendationPrice: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  recommendationSupplier: {
    fontSize: 10,
    color: '#8B5CF6',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AIRecommendations;