import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const AIRecommendations = ({ onAddRecommendation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FAF5FF', '#EFF6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientContainer}
      >
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
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => onAddRecommendation(recommendation)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientContainer: {
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
    minWidth: 200,
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
