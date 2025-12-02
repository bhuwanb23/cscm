import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const HelpItem = ({ item, onPress }) => {
  const getIconName = (icon) => {
    switch (icon) {
      case 'circle-question':
        return 'help-circle';
      case 'truck':
        return 'car';
      case 'headset':
        return 'headset';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.helpCard}
      onPress={() => onPress(item)}
    >
      <View style={styles.helpContent}>
        <View style={styles.helpIcon}>
          <Ionicons 
            name={getIconName(item.icon)} 
            size={20} 
            color={COLORS.primary} 
          />
        </View>
        
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.helpDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={COLORS.gray[400]} 
        />
      </View>
    </TouchableOpacity>
  );
};

const QuickHelpSection = ({ helpItems, onHelpItemPress, onViewAllPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Quick Help</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.helpList}>
        {helpItems.map((item) => (
          <HelpItem
            key={item.id}
            item={item}
            onPress={onHelpItemPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  helpList: {
    gap: 6,
  },
  helpCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIcon: {
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 10,
    color: COLORS.gray[600],
    lineHeight: 14,
  },
});

export default QuickHelpSection;