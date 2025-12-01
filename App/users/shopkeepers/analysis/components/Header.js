import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>CSCM Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Central brain of the Cognitive Supply Chain Mesh
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#DBEAFE',
    opacity: 0.9,
  },
});

export default Header;