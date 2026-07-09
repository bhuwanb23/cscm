import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Alerts from './alerts/alerts';
import Graph from './graph/graph';
import Drift from './drift/drift';
import Network from './network/network';

const TABS = [
  { id: 'alerts', label: 'Alerts', icon: 'alert-circle-outline' },
  { id: 'graph', label: 'Graph', icon: 'git-network-outline' },
  { id: 'drift', label: 'Drift', icon: 'pulse-outline' },
  { id: 'network', label: 'Network', icon: 'globe-outline' },
];

// ALLOW_ALL_ROLES: set to false in production to gate mesh behind admin
const ALLOW_ALL_ROLES = true;
const ALLOWED_ROLES = ['admin', 'operator'];

const MeshConsole = ({ onLogout, role }) => {
  if (!ALLOW_ALL_ROLES && (!role || !ALLOWED_ROLES.includes(role))) {
    return null;
  }

  const [activeTab, setActiveTab] = useState('alerts');

  const renderContent = () => {
    switch (activeTab) {
      case 'graph': return <Graph onBack={() => setActiveTab('alerts')} />;
      case 'drift': return <Drift onBack={() => setActiveTab('alerts')} />;
      case 'network': return <Network onBack={() => setActiveTab('alerts')} />;
      case 'alerts':
      default:
        return <Alerts onBack={null} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        {renderContent()}
        <View style={styles.tabbar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                  size={20}
                  color={isActive ? '#3B82F6' : '#6B7280'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  tabbar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 8, paddingBottom: 12, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  tabLabelActive: { color: '#3B82F6', fontWeight: '700' },
});

export default MeshConsole;
