import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../hooks/useAnalysis';
import { METRIC_CONFIG, ANALYSIS_TABS } from '../constants';
import Header from './Header'; // Import the Header component

// Import individual tab components
import InventoryTab from './tabs/InventoryTab';
import DemandTab from './tabs/DemandTab';
import RebalancingTab from './tabs/RebalancingTab';
import ChannelTab from './tabs/ChannelTab';
import SkuTab from './tabs/SkuTab';
import ProcurementTab from './tabs/ProcurementTab';
import RiskTab from './tabs/RiskTab';
import TwinsTab from './tabs/TwinsTab';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Safely handle value formatting
  const displayValue = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value || '';

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
        {displayValue}
        {config.suffix || ''}
      </Text>
    </Animated.View>
  );
});

// Tab Button Component
const TabButton = React.memo(({ title, isActive, onPress }) => {
  // Safety check for title
  const displayTitle = title || 'Untitled';

  return (
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
          {displayTitle}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// Modern Tab Content
const ModernTabContent = React.memo(({ title, children }) => {
  // Safety check for title
  const displayTitle = title || 'Untitled';

  return (
    <ModernCard style={styles.tabContentCard}>
      <View style={styles.tabContentHeader}>
        <Text style={styles.tabContentTitle}>{displayTitle}</Text>
        <View style={styles.divider} />
      </View>
      {children}
    </ModernCard>
  );
});

// Module Progress Item
const ModuleProgressItem = React.memo(({ moduleId, progress }) => {
  // Safety check for moduleId
  const displayName = moduleId ? (moduleId.charAt(0).toUpperCase() + moduleId.slice(1)) : 'Unknown Module';
  const displayProgress = progress || 0;

  return (
    <View style={styles.moduleProgressItem}>
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleName}>
          {displayName}
        </Text>
        <Text style={styles.moduleProgressText}>{displayProgress}%</Text>
      </View>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={[styles.progressFill, { width: `${displayProgress}%` }]}
        />
      </View>
    </View>
  );
});

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

  // Safety check for insight
  const displayInsight = insight || 'No insight available';

  return (
    <Animated.View style={[styles.insightItem, { opacity: fadeAnim }]}>
      <View style={styles.insightIconContainer}>
        <Ionicons name="bulb" size={20} color="#F59E0B" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>AI Insight #{index + 1}</Text>
        <Text style={styles.insightText}>{displayInsight}</Text>
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

  // State to control whether content should be displayed
  const [showContent, setShowContent] = useState(false);

  // When analysis is completed, show the content
  useEffect(() => {
    if (status === 'done') {
      setShowContent(true);
    }
  }, [status]);

  // Reset content visibility when analysis starts
  const handleStartAnalysis = useCallback(() => {
    setShowContent(false);
    startAnalysis();
  }, [startAnalysis]);

  // Memoize tab content to prevent unnecessary re-renders
  const renderActiveTabContent = useCallback(() => {
    if (!showContent) return null;

    switch (activeTab) {
      case 'Inventory Health':
        return <InventoryTab />;
      case 'Demand Forecast':
        return <DemandTab />;
      case 'Rebalancing':
        return <RebalancingTab />;
      case 'Channel Sync':
        return <ChannelTab />;
      case 'SKU Intelligence':
        return <SkuTab />;
      case 'Procurement':
        return <ProcurementTab />;
      case 'Risk & Alerts':
        return <RiskTab />;
      case 'Digital Twins Explorer':
        return <TwinsTab />;
      default:
        // Add safety check for activeTab
        const tabTitle = activeTab || 'Unknown Tab';
        return (
          <ModernTabContent title={tabTitle}>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Analysis Results</Text>
              <Text style={styles.cardDescription}>
                Detailed insights and recommendations for {tabTitle.toLowerCase()}.
              </Text>
            </View>
          </ModernTabContent>
        );
    }
  }, [activeTab, showContent]);

  // Memoize metrics entries to prevent unnecessary re-renders
  const memoizedMetrics = useMemo(() => Object.entries(metrics), [metrics]);
  const memoizedModuleProgress = useMemo(() => Object.entries(moduleProgress), [moduleProgress]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <Header />
      
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
              onPress={handleStartAnalysis}
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

        {/* Show content only after analysis is run */}
        {showContent && (
          <>
            {/* Module Progress */}
            <ModernCard style={styles.progressCard}>
              <Text style={styles.sectionTitle}>Analysis Modules</Text>
              <View style={styles.moduleProgressContainer}>
                {memoizedModuleProgress.map(([moduleId, progress]) => (
                  <ModuleProgressItem 
                    key={moduleId} 
                    moduleId={moduleId} 
                    progress={progress} 
                  />
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
            <View style={styles.tabContentWrapper}>
              {renderActiveTabContent()}
            </View>

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
          </>
        )}

        {/* Show initial message when no content is displayed */}
        {!showContent && status !== 'running' && (
          <View style={styles.initialMessageContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.initialMessageCard}
            >
              <View style={styles.initialMessageContent}>
                <Ionicons name="analytics" size={48} color="#3B82F6" />
                <Text style={styles.initialMessageTitle}>Supply Chain Analysis</Text>
                <Text style={styles.initialMessageText}>
                  Click "Run Analysis" to generate insights and recommendations for your supply chain operations.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modernCard: {
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
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
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
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
    elevation: 1,
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
    elevation: 2,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
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
  tabContentWrapper: {
    marginBottom: 15,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  metricLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 8,
  },
  trendTextPositive: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  trendTextNegative: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    width: 80,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartBar: {
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  chartValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  heatmapContainer: {
    marginTop: 10,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heatmapLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    width: 60,
  },
  heatmapDots: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heatmapDotLow: {
    backgroundColor: '#10B981',
  },
  heatmapDotMedium: {
    backgroundColor: '#F59E0B',
  },
  heatmapDotHigh: {
    backgroundColor: '#EF4444',
  },
  heatmapLegend: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
  },
  initialMessageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  initialMessageCard: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  initialMessageContent: {
    alignItems: 'center',
  },
  initialMessageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 16,
    marginBottom: 8,
  },
  initialMessageText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default Analysis;