import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useGraphData } from './hooks/useGraphData';

const TYPE_COLORS = {
  shopkeeper: '#3B82F6',
  wholesaler: '#8B5CF6',
  warehouse: '#F59E0B',
  transporter: '#10B981',
  'central-planner': '#EF4444',
  default: '#6B7280',
};

const TYPE_ICONS = {
  shopkeeper: 'storefront',
  wholesaler: 'business',
  warehouse: 'archive',
  transporter: 'car',
  'central-planner': 'pulse',
  default: 'cube',
};

const Graph = ({ onBack }) => {
  const { graph, query, setQuery, refetch } = useGraphData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  const nodesByType = (graph.nodes || []).reduce((acc, n) => {
    const t = n.type || 'default';
    (acc[t] = acc[t] || []).push(n);
    return acc;
  }, {});

  const connectedEdges = selectedNode ? (graph.edges || []).filter(e => e.from === selectedNode.id || e.to === selectedNode.id) : [];

  return (
    <View style={styles.container}>
      <Header title="Knowledge Graph" subtitle="Mesh topology and relationships" onBack={onBack} />
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search nodes or relationships..."
            placeholderTextColor="#9CA3AF"
          />
          {query ? <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={16} color="#9CA3AF" /></TouchableOpacity> : null}
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{(graph.nodes || []).length}</Text><Text style={styles.summaryLabel}>Nodes</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{(graph.edges || []).length}</Text><Text style={styles.summaryLabel}>Edges</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{Object.keys(nodesByType).length}</Text><Text style={styles.summaryLabel}>Types</Text></View>
          </View>
        </Card>

        {Object.entries(nodesByType).map(([type, nodes]) => (
          <View key={type} style={styles.typeSection}>
            <View style={styles.typeHeader}>
              <Ionicons name={TYPE_ICONS[type] || TYPE_ICONS.default} size={16} color={TYPE_COLORS[type] || TYPE_COLORS.default} />
              <Text style={styles.typeLabel}>{type.replace('-', ' ').toUpperCase()}</Text>
              <Text style={styles.typeCount}>{nodes.length}</Text>
            </View>
            {nodes.map((node) => (
              <TouchableOpacity key={node.id} onPress={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}>
                <Card style={[styles.nodeCard, selectedNode?.id === node.id && styles.nodeCardSelected]}>
                  <View style={styles.nodeRow}>
                    <View style={[styles.nodeDot, { backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.default }]} />
                    <Text style={styles.nodeLabel}>{node.label}</Text>
                    <Ionicons name={selectedNode?.id === node.id ? 'chevron-up' : 'chevron-down'} size={14} color="#9CA3AF" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {selectedNode && connectedEdges.length > 0 && (
          <View style={styles.connections}>
            <Text style={styles.connectionsTitle}>Connections ({connectedEdges.length})</Text>
            {connectedEdges.map((edge, i) => (
              <View key={i} style={styles.edgeRow}>
                <Ionicons name={edge.from === selectedNode.id ? 'arrow-forward' : 'arrow-back'} size={12} color="#3B82F6" />
                <Text style={styles.edgeText}>{edge.from} {edge.relationship} {edge.to}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  summary: { borderRadius: 12, padding: 12, marginBottom: 16, elevation: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#3B82F6' },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  typeSection: { marginBottom: 16 },
  typeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 },
  typeLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, flex: 1 },
  typeCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  nodeCard: { borderRadius: 10, padding: 10, marginBottom: 6, elevation: 1 },
  nodeCardSelected: { borderColor: '#3B82F6', borderWidth: 1 },
  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nodeDot: { width: 8, height: 8, borderRadius: 4 },
  nodeLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },
  connections: { marginTop: 8, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#DBEAFE' },
  connectionsTitle: { fontSize: 12, fontWeight: '700', color: '#1E40AF', marginBottom: 8 },
  edgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  edgeText: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
});

export default Graph;
