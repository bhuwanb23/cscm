import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const UpcomingTurns = ({ turns }) => {
  const upcomingTurns = turns && turns.length > 0 ? turns : [
    { instruction: 'Head north on Main St', distance: '200 m', icon: 'arrow-up' },
    { instruction: 'Turn right onto Oak Ave', distance: '1.2 km', icon: 'turn-right' },
    { instruction: 'Continue straight', distance: '800 m', icon: 'arrow-forward' },
    { instruction: 'Turn left onto Pine Rd', distance: '450 m', icon: 'turn-left' },
  ];

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="navigate" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Upcoming Turns</Text>
          </View>
        </View>
        <View style={styles.turnsList}>
          {upcomingTurns.map((turn, index) => (
            <View
              key={index}
              style={[
                styles.turnItem,
                index === 0 && styles.nextTurn,
                index !== upcomingTurns.length - 1 && styles.turnBorder,
              ]}
            >
              <View style={[styles.turnIconContainer, index === 0 && styles.nextTurnIcon]}>
                {index === 0 ? (
                  <LinearGradient
                    colors={['#3B82F6', '#1E40AF']}
                    style={styles.turnIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={turn.icon} size={16} color="#fff" />
                  </LinearGradient>
                ) : (
                  <Ionicons name={turn.icon} size={20} color="#3B82F6" />
                )}
              </View>
              <View style={styles.turnInfo}>
                <Text style={[styles.turnInstruction, index === 0 && styles.nextTurnInstruction]}>
                  {turn.instruction}
                </Text>
                <Text style={styles.turnDistance}>{turn.distance}</Text>
              </View>
              {index === 0 && (
                <View style={styles.nextTurnBadge}>
                  <Text style={styles.nextTurnText}>NEXT</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff' },
  cardContent: { padding: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 },
  turnsList: { padding: 16 },
  turnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  nextTurn: { backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 8, paddingHorizontal: 12, marginVertical: 4 },
  turnBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  turnIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  turnIconGradient: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nextTurnIcon: {},
  turnInfo: { flex: 1 },
  turnInstruction: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  nextTurnInstruction: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  turnDistance: { fontSize: 12, color: '#9CA3AF' },
  nextTurnBadge: { backgroundColor: '#2563EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  nextTurnText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});

export default UpcomingTurns;
