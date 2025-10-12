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
        
        <Text style={styles.helpTitle}>{item.title}</Text>
        
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  helpList: {
    gap: 8,
  },
  helpCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    padding: 12,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpIcon: {
    marginRight: 12,
  },
  helpTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
});

export default QuickHelpSection;
