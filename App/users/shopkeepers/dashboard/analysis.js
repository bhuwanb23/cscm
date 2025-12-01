import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardData } from './hooks/useDashboardData';
import AnalysisPanel from './components/AnalysisPanel';

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={18} color="#2563EB" style={styles.sectionIcon} />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>
      {children}
    </View>
  </View>
);

const Bullet = ({ label, value }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bulletText}>
      <Text style={styles.bulletLabel}>{label}: </Text>
      {value}
    </Text>
  </View>
);

const Analysis = () => {
  const { analysisState, startAnalysis } = useDashboardData();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />

      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>CSCM Mesh Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Digital twins, agents and optimization – demo view
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AnalysisPanel analysis={analysisState} onStart={startAnalysis} />

        <Section title="Digital Twins Layer" icon="cube-outline">
          <Text style={styles.sectionIntro}>
            Every key entity is mirrored as a virtual twin and scanned during the analysis run.
          </Text>
          <Bullet
            label="Product twin"
            value="Tracks per‑SKU inventory, sales velocity, demand spikes, and forecast vs. actuals."
          />
          <Bullet
            label="Store twin"
            value="Captures store‑level sell‑through, local events, and allocation rules."
          />
          <Bullet
            label="Warehouse twin"
            value="Maintains on‑hand, inbound POs, and cross‑dock capacity for each node."
          />
          <Bullet
            label="Region & channel twins"
            value="Summarize behavior by region (NA, EMEA, APAC) and by channel (store, online, quick‑commerce)."
          />
          <Bullet
            label="Customer behavior twin"
            value="Aggregates cart abandonment, repeat purchase, and promotion lift patterns."
          />
        </Section>

        <Section title="AI Agent Mesh" icon="git-branch-outline">
          <Text style={styles.sectionIntro}>
            Each twin is controlled by a lightweight agent; agents coordinate as a mesh.
          </Text>
          <Bullet
            label="Product Agent"
            value="Watches sales velocity and flags out‑of‑stock and overstock risk per SKU."
          />
          <Bullet
            label="Store Agent"
            value="Requests replenishment or transfers based on local demand and shelf space."
          />
          <Bullet
            label="Warehouse Agent"
            value="Allocates cases across stores and channels, respecting constraints."
          />
          <Bullet
            label="Fulfillment Agent"
            value="Chooses best route / node for each order (service level vs. cost)."
          />
          <Bullet
            label="Procurement Agent"
            value="Proposes POs and supplier splits when systemic shortages are detected."
          />
          <Bullet
            label="Risk Agent"
            value="Surfaces demand spikes or supply delays for the planner to review."
          />
        </Section>

        <Section title="Federated Learning & Privacy" icon="shield-checkmark-outline">
          <Text style={styles.sectionIntro}>
            In production this runs as federated learning – here we mimic the behavior with sample
            data only.
          </Text>
          <Bullet
            label="Local learning"
            value="Each store/brand trains models on its own history and context."
          />
          <Bullet
            label="Global insights"
            value="Only gradients / summaries are shared, never raw customer data."
          />
          <Bullet
            label="Benefits"
            value="Better accuracy per region, preserved data ownership, and faster adaptation."
          />
        </Section>

        <Section title="Optimization Engine" icon="analytics-outline">
          <Text style={styles.sectionIntro}>
            The optimization layer turns agent signals into concrete actions for the planner.
          </Text>
          <Bullet
            label="Replenishment"
            value="Suggests per‑store order quantities and timing to pre‑empt stock‑outs."
          />
          <Bullet
            label="Store‑to‑store transfers"
            value="Rebalances inventory between nearby stores before ordering from vendors."
          />
          <Bullet
            label="Warehouse allocation"
            value="Chooses which DC ships which demand cluster to minimize cost and risk."
          />
          <Bullet
            label="Vendor ordering"
            value="Recommends PO bundles by supplier, MOQ and lead time."
          />
          <Bullet
            label="Route optimization"
            value="Aligns the above with transport capacity and promised delivery windows."
          />
        </Section>

        <Section title="Human-In-The-Loop" icon="person-outline">
          <Text style={styles.sectionIntro}>
            Nothing is auto‑executed: this page is designed as a control tower for planners.
          </Text>
          <Bullet
            label="Planner workflow"
            value="Review suggested SKUs, transfers and POs → approve / adjust / reject."
          />
          <Bullet
            label="One‑click actions"
            value="Each recommendation can map to a stored action template (PO draft, transfer, route update)."
          />
          <Bullet
            label="Feedback loop"
            value="Planner overrides are learned by the mesh, improving future recommendations."
          />
        </Section>

        <Section title="Explainable AI (Why this decision?)" icon="eye-outline">
          <Text style={styles.sectionIntro}>
            For every recommended action, the system can expose a compact explanation.
          </Text>
          <Bullet
            label="Why"
            value="Top drivers (cart demand, recent stock‑outs, promotion response) that triggered the alert."
          />
          <Bullet
            label="Based on what"
            value="Time window, locations, demand samples and risk signals used for this call."
          />
          <Bullet
            label="Expected outcome"
            value="Projected fill‑rate improvement, lost‑sales avoided, or cost impact."
          />
          <Bullet
            label="Confidence"
            value="A score derived from forecast uncertainty and data coverage, surfaced next to each action."
          />
        </Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionIntro: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginRight: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  bulletLabel: {
    fontWeight: '600',
  },
});

export default Analysis;


