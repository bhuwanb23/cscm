import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../hooks/useAnalysis';
import { METRIC_CONFIG, ANALYSIS_TABS } from '../constants';

// Modern Card Component
const ModernCard = React.memo(({ children, style }) => (
  <View style={[styles.modernCard, style]}>
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      style={styles.cardGradient}
    >
      {children}
    </LinearGradient>
  </View>
));

// Animated Metric Card
const AnimatedMetricCard = React.memo(({ metricKey, value, config }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value]);

  // Check if config exists before rendering
  if (!config) {
    return null;
  }

  return (
    <Animated.View style={[styles.metricCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{config.label || 'Unknown Metric'}</Text>
        {config.color && (
          <View style={[styles.metricIndicator, { backgroundColor: config.color }]} />
        )}
      </View>
      <Text style={[styles.metricValue, config.color && { color: config.color }]}>
        {config.prefix || ''}
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        {config.suffix || ''}
      </Text>
    </Animated.View>
  );
});

// Tab Button Component
const TabButton = React.memo(({ title, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.tabButton, isActive && styles.activeTabButton]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={isActive ? ['#3B82F6', '#1E40AF'] : ['#F1F5F9', '#E2E8F0']}
      style={[styles.tabGradient, isActive && styles.activeTabGradient]}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
));

// Modern Tab Content
const ModernTabContent = React.memo(({ title, children }) => (
  <ModernCard style={styles.tabContentCard}>
    <View style={styles.tabContentHeader}>
      <Text style={styles.tabContentTitle}>{title}</Text>
      <View style={styles.divider} />
    </View>
    {children}
  </ModernCard>
));

// Insight Item Component
const InsightItem = React.memo(({ insight, index }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.insightItem, { opacity: fadeAnim }]}>
      <View style={styles.insightIconContainer}>
        <Ionicons name="bulb" size={20} color="#F59E0B" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>AI Insight #{index + 1}</Text>
        <Text style={styles.insightText}>{insight}</Text>
      </View>
    </Animated.View>
  );
});

const Analysis = () => {
  const {
    status,
    activeTab,
    metrics,
    moduleProgress,
    insights,
    runScale,
    setActiveTab,
    startAnalysis,
  } = useAnalysis();

  // Memoize tab content to prevent unnecessary re-renders
  const renderActiveTabContent = useCallback(() => {
    switch (activeTab) {
      case 'Inventory Health':
        return (
          <ModernTabContent title="Inventory Health Dashboard">
            <View style={styles.contentRow}>
              <View style={styles.halfCard}>
                <Text style={styles.cardTitle}>Inventory Mesh</Text>
                <Text style={styles.cardDescription}>
                  Live view of all SKUs by node, with low‑stock and excess‑stock heat overlays.
                </Text>
              </View>
              <View style={styles.halfCard}>
                <Text style={styles.cardTitle}>SKU Velocity</Text>
                <Text style={styles.cardDescription}>
                  Fast vs slow movers by store, with demand spikes and ageing buckets.
                </Text>
              </View>
            </View>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>AI Actions</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Predicts which SKUs will go OOS in 7-14 days</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Flags slow-moving SKUs for sale</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Highlights store-to-store transfers</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Surfaces ageing items beyond 90 days</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Demand Forecast':
        return (
          <ModernTabContent title="Demand Forecast Engine">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Forecast Highlights</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="trending-up" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>Top 10 fast movers by uplift vs last week</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trending-down" size={16} color="#EF4444" />
                  <Text style={styles.bulletText}>Top 10 slow movers trending to markdown</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="map" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Region-wise demand maps to align supply</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Confidence scores per item for planning</Text>
                </View>
              </View>
            </View>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>AI Predictions</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="calendar" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Weekend spike of 2.1x expected on beverages</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="location" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>SKU X selling 3x faster in Bangalore</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trending-up" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>SKU Y trending on marketplace channels</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Rebalancing':
        return (
          <ModernTabContent title="Rebalancing & Optimal Allocation">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Optimization Outputs</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>Store-to-store transfers to reduce stockouts</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="home" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Warehouse-to-store replenishments</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="cash" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Estimated cost savings and transfer gain</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trail-sign" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>Truck capacity and route feasibility check</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Channel Sync':
        return (
          <ModernTabContent title="Channel Sync & Availability Mesh">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Channel Intelligence</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="layers" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>D2C vs marketplace stock comparison</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="wifi" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>API sync health indicators</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.bulletText}>Fake-stock detection and overselling risk</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="speedometer" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Quick-commerce readiness score</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'SKU Intelligence':
        return (
          <ModernTabContent title="SKU Performance Intelligence">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Lifecycle & Performance</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="git-branch" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>Stage classification: New/Growth/Peak/Decline</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="color-palette" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Style-level and variant-level performance</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="bar-chart" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Margin contribution and sell-through heatmaps</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="return-down-back" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>Return-rate analytics for quality investigations</Text>
                </View>
              </View>
            </View>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>AI Actions</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="refresh" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>SKU X has 70% sell-through and should be reordered</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={styles.bulletText}>SKU Y has 18% return rate - quality check needed</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Procurement':
        return (
          <ModernTabContent title="Procurement Simulation">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Procurement Signals</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="time" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>Vendor-wise lead times and reliability scores</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="calculator" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Recommended PO quantities balancing MOQ vs demand</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="shirt" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Fabric/yarn/material demand forecast</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="wallet" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>Budget impact simulation for PO adjustments</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Risk & Alerts':
        return (
          <ModernTabContent title="Risk & Alerts Center">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Risk Types Monitored</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={styles.bulletText}>Stockout and overstock risk per SKU/node</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="hourglass" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>Ageing inventory and write-off exposure</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="timer" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>Vendor delay probabilities and OTIF risk</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="wifi" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>API sync failures and SKU tampering risk</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="calendar" size={16} color="#10B981" />
                  <Text style={styles.bulletText}>Seasonal spike warnings and sales-dip alerts</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      case 'Digital Twins Explorer':
        return (
          <ModernTabContent title="Digital Twin Explorer (Preview)">
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Example Simulations</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="analytics" size={16} color="#3B82F6" />
                  <Text style={styles.bulletText}>If we increase production by 20%, which nodes saturate first?</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="storefront" size={16} color="#8B5CF6" />
                  <Text style={styles.bulletText}>If Store A closes for 5 days, what is the revenue and service-level impact?</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trending-up" size={16} color="#F59E0B" />
                  <Text style={styles.bulletText}>If we get a 2x weekend spike, which SKUs/regions break first?</Text>
                </View>
              </View>
            </View>
          </ModernTabContent>
        );
      default:
        return (
          <ModernTabContent title={activeTab}>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Analysis Results</Text>
              <Text style={styles.cardDescription}>
                Detailed insights and recommendations for {activeTab.toLowerCase()}.
              </Text>
            </View>
          </ModernTabContent>
        );
    }
  }, [activeTab]);

  // Memoize metrics entries to prevent unnecessary re-renders
  const memoizedMetrics = useMemo(() => Object.entries(metrics), [metrics]);
  const memoizedModuleProgress = useMemo(() => Object.entries(moduleProgress), [moduleProgress]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CSCM Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Central brain of the Cognitive Supply Chain Mesh
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Action Bar */}
        <View style={styles.actionBar}>
          <Animated.View style={[styles.runButtonContainer, { transform: [{ scale: runScale }] }]}>
            <TouchableOpacity
              style={styles.runButton}
              onPress={startAnalysis}
              activeOpacity={0.9}
              disabled={status === 'running'}
            >
              <LinearGradient
                colors={status === 'running' ? ['#F59E0B', '#D97706'] : ['#10B981', '#059669']}
                style={styles.runButtonGradient}
              >
                <Ionicons 
                  name={status === 'running' ? 'flash' : 'play'} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.runButtonText}>
                  {status === 'running' ? 'Analyzing...' : 'Run Analysis'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="grid" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="sparkles" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Module Progress */}
        <ModernCard style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Analysis Modules</Text>
          <View style={styles.moduleProgressContainer}>
            {memoizedModuleProgress.map(([moduleId, progress]) => (
              <View key={moduleId} style={styles.moduleProgressItem}>
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleName}>
                    {moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}
                  </Text>
                  <Text style={styles.moduleProgressText}>{progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#3B82F6', '#1E40AF']}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </ModernCard>

        {/* Metrics Dashboard */}
        <ModernCard style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {memoizedMetrics.map(([key, value]) => (
              <AnimatedMetricCard 
                key={key} 
                metricKey={key} 
                value={value} 
                config={METRIC_CONFIG[key]} 
              />
            ))}
          </View>
        </ModernCard>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {ANALYSIS_TABS.map(tab => (
            <TabButton
              key={tab}
              title={tab}
              isActive={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </ScrollView>

        {/* Tab Content */}
        {renderActiveTabContent()}

        {/* Insights Feed */}
        <ModernCard style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Text style={styles.sectionTitle}>AI Insights Feed</Text>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.insightsDescription}>
            Real-time narrative of what the mesh is seeing
          </Text>
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <InsightItem key={index} insight={insight} index={index} />
            ))
          ) : (
            <View style={styles.noInsights}>
              <Ionicons name="information-circle" size={24} color="#94A3B8" />
              <Text style={styles.noInsightsText}>
                Run analysis to generate live insights from sample data
              </Text>
            </View>
          )}
        </ModernCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  runButtonContainer: {
    flex: 1,
    marginRight: 15,
  },
  runButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  runButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernCard: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
  },
  progressCard: {
    marginBottom: 15,
  },
  moduleProgressContainer: {
    gap: 15,
  },
  moduleProgressItem: {
    marginBottom: 10,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  moduleProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsCard: {
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  metricIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  tabsContainer: {
    marginBottom: 15,
  },
  tabsContent: {
    paddingVertical: 5,
    paddingRight: 10,
  },
  tabButton: {
    marginRight: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeTabGradient: {
    elevation: 3,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContentCard: {
    marginBottom: 15,
  },
  tabContentHeader: {
    marginBottom: 15,
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
  },
  fullCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  insightsCard: {
    marginBottom: 15,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  insightsDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 15,
  },
  insightItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  insightIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noInsightsText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Analysis;