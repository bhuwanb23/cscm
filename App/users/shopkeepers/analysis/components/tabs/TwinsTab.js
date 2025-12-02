import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TwinsTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Digital Twin Explorer (Preview)</Text>
        <Text style={styles.description}>
          What-if scenario simulations and predictive modeling for supply chain optimization
        </Text>
      </View>
      
      {/* What users can do */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>What You Can Do</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="eye" size={16} color="#3B82F6" />
            <Text style={styles.featureText}>Explore the virtual version of your supply chain</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="finger-print" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Click on any twin: Product, Store, Region, Warehouse</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="stats-chart" size={16} color="#10B981" />
            <Text style={styles.featureText}>View real-time conditions and performance metrics</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="game-controller" size={16} color="#F59E0B" />
            <Text style={styles.featureText}>Simulate changes and predict outcomes</Text>
          </View>
        </View>
      </View>
      
      {/* Twin Explorer Visualization */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Digital Twin Network</Text>
        <View style={styles.twinNetwork}>
          <View style={styles.twinNode}>
            <Ionicons name="cube" size={24} color="#3B82F6" />
            <Text style={styles.nodeName}>Products</Text>
            <Text style={styles.nodeCount}>1,245 SKUs</Text>
          </View>
          <View style={styles.connectionLine} />
          <View style={styles.twinNode}>
            <Ionicons name="storefront" size={24} color="#8B5CF6" />
            <Text style={styles.nodeName}>Stores</Text>
            <Text style={styles.nodeCount}>24 Locations</Text>
          </View>
          <View style={styles.connectionLine} />
          <View style={styles.twinNode}>
            <Ionicons name="map" size={24} color="#10B981" />
            <Text style={styles.nodeName}>Regions</Text>
            <Text style={styles.nodeCount}>5 Zones</Text>
          </View>
          <View style={styles.connectionLine} />
          <View style={styles.twinNode}>
            <Ionicons name="business" size={24} color="#F59E0B" />
            <Text style={styles.nodeName}>Warehouses</Text>
            <Text style={styles.nodeCount}>3 Facilities</Text>
          </View>
        </View>
      </View>
      
      {/* Example Simulations */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Example Simulations</Text>
        <View style={styles.simulationGrid}>
          <View style={styles.simulationCard}>
            <View style={styles.simulationHeader}>
              <Ionicons name="trending-up" size={20} color="#3B82F6" />
              <Text style={styles.simulationTitle}>Production Increase</Text>
            </View>
            <Text style={styles.simulationQuestion}>If we increase production by 20%, what happens?</Text>
            <View style={styles.simulationResults}>
              <Text style={styles.resultItem}>• Nodes saturate in 3-5 days</Text>
              <Text style={styles.resultItem}>• Storage capacity reaches 95%</Text>
              <Text style={styles.resultItem}>• Transportation bottlenecks emerge</Text>
            </View>
            <View style={styles.simulationAction}>
              <Text style={styles.runSimulation}>Run Simulation</Text>
            </View>
          </View>
          
          <View style={styles.simulationCard}>
            <View style={styles.simulationHeader}>
              <Ionicons name="storefront" size={20} color="#8B5CF6" />
              <Text style={styles.simulationTitle}>Store Closure</Text>
            </View>
            <Text style={styles.simulationQuestion}>If Store A closes for 5 days, what's the impact?</Text>
            <View style={styles.simulationResults}>
              <Text style={styles.resultItem}>• Revenue loss: ₹2.1L</Text>
              <Text style={styles.resultItem}>• Customer diversion to nearby stores</Text>
              <Text style={styles.resultItem}>• Service level drops by 12%</Text>
            </View>
            <View style={styles.simulationAction}>
              <Text style={styles.runSimulation}>Run Simulation</Text>
            </View>
          </View>
          
          <View style={styles.simulationCard}>
            <View style={styles.simulationHeader}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
              <Text style={styles.simulationTitle}>Demand Spike</Text>
            </View>
            <Text style={styles.simulationQuestion}>If we get 2x demand spike this weekend?</Text>
            <View style={styles.simulationResults}>
              <Text style={styles.resultItem}>• Stockouts in 3 product categories</Text>
              <Text style={styles.resultItem}>• Overtime required for 2 warehouses</Text>
              <Text style={styles.resultItem}>• Delivery delays increase by 40%</Text>
            </View>
            <View style={styles.simulationAction}>
              <Text style={styles.runSimulation}>Run Simulation</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Twin Interaction Panel */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Twin Interaction Panel</Text>
        <View style={styles.interactionPanel}>
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>Select a Twin Type</Text>
            <View style={styles.twinTypes}>
              <View style={[styles.twinTypeButton, styles.activeTwinType]}>
                <Ionicons name="cube" size={16} color="#3B82F6" />
                <Text style={styles.twinTypeText}>Product</Text>
              </View>
              <View style={styles.twinTypeButton}>
                <Ionicons name="storefront" size={16} color="#64748B" />
                <Text style={styles.twinTypeText}>Store</Text>
              </View>
              <View style={styles.twinTypeButton}>
                <Ionicons name="map" size={16} color="#64748B" />
                <Text style={styles.twinTypeText}>Region</Text>
              </View>
              <View style={styles.twinTypeButton}>
                <Ionicons name="business" size={16} color="#64748B" />
                <Text style={styles.twinTypeText}>Warehouse</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>Current Selection</Text>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectedTwin}>SKU A123 - Summer Dress</Text>
              <Text style={styles.selectionDetail}>Current stock: 245 units</Text>
              <Text style={styles.selectionDetail}>Predicted demand: 150 units/week</Text>
            </View>
          </View>
          
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>Simulation Controls</Text>
            <View style={styles.controlButtons}>
              <View style={styles.controlButton}>
                <Ionicons name="add" size={16} color="#3B82F6" />
                <Text style={styles.controlText}>Increase Stock</Text>
              </View>
              <View style={styles.controlButton}>
                <Ionicons name="remove" size={16} color="#EF4444" />
                <Text style={styles.controlText}>Reduce Stock</Text>
              </View>
              <View style={styles.controlButton}>
                <Ionicons name="pulse" size={16} color="#10B981" />
                <Text style={styles.controlText}>Simulate Demand</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Future Features */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <View style={styles.futureFeatures}>
          <View style={styles.futureFeature}>
            <Ionicons name="lock-closed" size={16} color="#94A3B8" />
            <Text style={styles.futureText}>AI-powered predictive maintenance</Text>
          </View>
          <View style={styles.futureFeature}>
            <Ionicons name="git-branch" size={16} color="#94A3B8" />
            <Text style={styles.futureText}>Multi-scenario comparison views</Text>
          </View>
          <View style={styles.futureFeature}>
            <Ionicons name="cloud-download" size={16} color="#94A3B8" />
            <Text style={styles.futureText}>Export simulation results</Text>
          </View>
          <View style={styles.futureFeature}>
            <Ionicons name="people" size={16} color="#94A3B8" />
            <Text style={styles.futureText}>Collaborative scenario planning</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TwinsTab;

const styles = StyleSheet.create({
  container: {
    // Removed padding to prevent pushing navbar up
  },
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  // Features list styles
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  // Twin network styles
  twinNetwork: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  twinNode: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 120,
    marginVertical: 8,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  nodeCount: {
    fontSize: 12,
    color: '#64748B',
  },
  connectionLine: {
    width: 2,
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  // Simulation grid styles
  simulationGrid: {
    gap: 16,
  },
  simulationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  simulationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  simulationQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    lineHeight: 20,
  },
  simulationResults: {
    marginBottom: 16,
  },
  resultItem: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 18,
  },
  simulationAction: {
    alignItems: 'flex-start',
  },
  runSimulation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  // Interaction panel styles
  interactionPanel: {
    gap: 16,
  },
  panelSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  twinTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  twinTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  activeTwinType: {
    backgroundColor: '#DBEAFE',
  },
  twinTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  selectionInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectedTwin: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  selectionDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  controlText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  // Future features styles
  futureFeatures: {
    gap: 12,
  },
  futureFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  futureText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});