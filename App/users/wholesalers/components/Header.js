import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ title, subtitle, onLogout, onProfilePress, onMessagesPress }) => {
  const handleLogout = () => {
    if (onLogout) onLogout();
    else Alert.alert('Logout', 'You have been signed out (demo)');
  };
  const handleProfile = () => {
    if (onProfilePress) onProfilePress();
    else Alert.alert('Profile', 'Open profile (demo)');
  };
  const handleMessages = () => {
    if (onMessagesPress) onMessagesPress();
    else Alert.alert('Messages', 'No new messages');
  };

  return (
    <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title || 'Wholesaler'}</Text>
          <Text style={styles.subtitle}>{subtitle || 'Supply Management'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleMessages}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleProfile}>
            <Ionicons name="person-circle-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12, paddingTop: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4, shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#DBEAFE', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

export default Header;
