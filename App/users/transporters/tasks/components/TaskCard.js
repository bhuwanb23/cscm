import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TaskCard = ({ task, onPress }) => {
  // Get status color based on task status
  const getStatusColor = (status) => {
    switch (status) {
      case 'inProgress':
        return '#2563EB';
      case 'pending':
        return '#F59E0B';
      case 'scheduled':
        return '#CBD5E1';
      case 'completed':
        return '#10B981';
      default:
        return '#CBD5E1';
    }
  };

  // Render different card layouts based on task type
  const renderCardContent = () => {
    switch (task.status) {
      case 'inProgress':
        return renderInProgressCard();
      case 'pending':
        return renderPendingCard();
      case 'scheduled':
        return renderScheduledCard();
      case 'completed':
        return renderCompletedCard();
      default:
        return renderDefaultCard();
    }
  };

  const renderInProgressCard = () => (
    <>
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.statusBadges}>
          <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.statusText, { color: '#2563EB' }]}>In Progress</Text>
          </View>
          {task.priority === 'high' && (
            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="flash" size={10} color="#EF4444" />
              <Text style={[styles.statusText, { color: '#EF4444' }]}>Priority</Text>
            </View>
          )}
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ETA</Text>
          <Text style={[styles.etaValue, { color: '#2563EB' }]}>{task.eta}</Text>
        </View>
      </View>

      <Text style={styles.orderId}>{task.orderId}</Text>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        {/* Vertical Line */}
        <View style={styles.verticalLineContainer}>
          <View style={styles.verticalLine}></View>
        </View>

        {/* Pickup Point */}
        <View style={styles.routePoint}>
          <View style={[styles.pointMarker, { backgroundColor: '#E2E8F0' }]}>
            <View style={[styles.pointInner, { backgroundColor: '#94A3B8' }]}></View>
          </View>
          <View style={styles.pointInfo}>
            <Text style={styles.pointLabel}>Pickup • {task.pickup.time}</Text>
            <Text style={styles.pointLocationCompleted}>{task.pickup.location}</Text>
          </View>
        </View>

        {/* Delivery Point */}
        <View style={styles.routePoint}>
          <View style={[styles.pointMarker, { backgroundColor: '#2563EB' }]}>
            <Ionicons name="location" size={10} color="#FFFFFF" />
          </View>
          <View style={styles.pointInfo}>
            <Text style={[styles.pointLabel, { color: '#2563EB' }]}>Delivery • {task.delivery.time}</Text>
            <Text style={styles.pointLocation}>{task.delivery.location}</Text>
            <Text style={styles.pointCity}>{task.delivery.city}</Text>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.packagesContainer}>
          <View style={styles.packageIcon}>
            <Ionicons name="cube" size={14} color="#64748B" />
          </View>
          <View style={styles.packageIcon}>
            <Ionicons name="cube" size={14} color="#64748B" />
          </View>
          <View style={styles.packageCount}>
            <Text style={styles.packageCountText}>+{task.packages - 2}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.navigateButton}>
          <Text style={styles.navigateButtonText}>Navigate</Text>
          <Ionicons name="location" size={14} color="#2563EB" style={styles.navigateIcon} />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPendingCard = () => (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadges}>
          <View style={[styles.statusBadge, { backgroundColor: '#FEFCE8' }]}>
            <Text style={[styles.statusText, { color: '#CA8A04' }]}>Pending Pickup</Text>
          </View>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>Window</Text>
          <Text style={[styles.etaValue, { color: '#334155' }]}>{task.window}</Text>
        </View>
      </View>

      <Text style={styles.orderId}>{task.orderId}</Text>

      <View style={styles.originContainer}>
        <View style={styles.originIcon}>
          <Ionicons name="archive" size={20} color="#CA8A04" />
        </View>
        <View style={styles.originInfo}>
          <Text style={styles.originLabel}>Origin</Text>
          <Text style={styles.originLocation}>{task.origin.location}</Text>
          <Text style={styles.specialHandling}>Special handling required: {task.origin.specialHandling}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dueContainer}>
          <Ionicons name="time" size={12} color="#64748B" />
          <Text style={styles.dueText}>Due in {task.dueIn}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </>
  );

  const renderScheduledCard = () => (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadges}>
          <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
            <Text style={[styles.statusText, { color: '#475569' }]}>Scheduled</Text>
          </View>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>Window</Text>
          <Text style={[styles.etaValue, { color: '#334155' }]}>{task.window}</Text>
        </View>
      </View>

      <Text style={styles.orderId}>{task.orderId}</Text>

      <View style={styles.originContainer}>
        <View style={styles.originIcon}>
          <Ionicons name="trail-sign" size={20} color="#64748B" />
        </View>
        <View style={styles.originInfo}>
          <Text style={styles.originLabel}>Destination</Text>
          <Text style={styles.originLocation}>{task.destination.location}</Text>
          <Text style={styles.specialHandling}>{task.destination.notes}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          {task.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </>
  );

  const renderCompletedCard = () => (
    <>
      <View style={styles.completedHeader}>
        <View style={styles.completedTitle}>
          <Text style={styles.completedOrderId}>{task.orderId}</Text>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </View>
        <Text style={styles.completedTime}>{task.completedTime}</Text>
      </View>
      <View style={styles.completedContent}>
        <Text style={styles.completedText}>Delivered to {task.deliveredTo}</Text>
      </View>
    </>
  );

  const renderDefaultCard = () => (
    <Text>Unknown task type</Text>
  );

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        task.status === 'completed' && styles.completedCard
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.statusBorder, { backgroundColor: getStatusColor(task.status) }]} />
      {renderCardContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  completedCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.75,
  },
  statusBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaContainer: {
    alignItems: 'flex-end',
  },
  etaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  etaValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    paddingLeft: 8,
  },
  routeContainer: {
    position: 'relative',
    paddingLeft: 20,
  },
  verticalLineContainer: {
    position: 'absolute',
    left: 7,
    top: 16,
    bottom: 24,
  },
  verticalLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#E2E8F0',
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  pointMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pointInfo: {
    marginLeft: 12,
  },
  pointLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pointLocation: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  pointLocationCompleted: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'line-through',
    textDecorationColor: '#94A3B8',
    textDecorationStyle: 'solid',
  },
  pointCity: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
    paddingLeft: 8,
  },
  packagesContainer: {
    flexDirection: 'row',
  },
  packageIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginLeft: -8,
  },
  packageCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginLeft: -8,
    paddingLeft: 2,
  },
  packageCountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  navigateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 6,
  },
  navigateIcon: {
    marginTop: 1,
  },
  originContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  originIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEFCE8',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  originInfo: {
    marginLeft: 12,
    flex: 1,
  },
  originLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  originLocation: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    lineHeight: 20,
  },
  specialHandling: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  completedTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedOrderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginRight: 8,
  },
  completedTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  completedContent: {
    paddingLeft: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default TaskCard;