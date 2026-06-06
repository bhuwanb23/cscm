import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Header = ({ title, subtitle, onBack, onLogout }) => (
  <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onLogout ? (
        <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12, paddingTop: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4, shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 11, color: '#DBEAFE', marginTop: 2 },
  iconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

export default Header;
