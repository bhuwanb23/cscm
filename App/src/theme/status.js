export const STATUS_META = {
  pending: {
    icon: 'clock', iconColor: '#6B7280',
    bg: '#FEF3C7', fg: '#92400E',
    statusLabel: 'Pending', statusColor: '#6B7280', statusBgColor: '#F3F4F6',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  approved: {
    icon: 'check-circle', iconColor: '#EAB308',
    bg: '#DBEAFE', fg: '#1E40AF',
    statusLabel: 'Approved', statusColor: '#EAB308', statusBgColor: '#FEF3C7',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  dispatched: {
    icon: 'truck', iconColor: '#3B82F6',
    bg: '#D1FAE5', fg: '#065F46',
    statusLabel: 'Dispatched', statusColor: '#3B82F6', statusBgColor: '#DBEAFE',
    actionText: 'Track Live', actionColor: '#3B82F6',
  },
  delivered: {
    icon: 'shield-alt', iconColor: '#10B981',
    bg: '#D1FAE5', fg: '#065F46',
    statusLabel: 'Delivered', statusColor: '#22C55E', statusBgColor: '#D1FAE5',
    actionText: 'View Receipt', actionColor: '#10B981',
  },
  rejected: {
    icon: 'times-circle', iconColor: '#EF4444',
    bg: '#FEE2E2', fg: '#B91C1C',
    statusLabel: 'Rejected', statusColor: '#EF4444', statusBgColor: '#FEE2E2',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  cancelled: {
    icon: 'ban', iconColor: '#EF4444',
    bg: '#FEE2E2', fg: '#B91C1C',
    statusLabel: 'Cancelled', statusColor: '#EF4444', statusBgColor: '#FEE2E2',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  in_transit: {
    icon: 'location-dot', iconColor: '#3B82F6',
    bg: '#DBEAFE', fg: '#1E40AF',
    statusLabel: 'In Transit', statusColor: '#3B82F6', statusBgColor: '#DBEAFE',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  arriving_soon: {
    icon: 'location-dot', iconColor: '#10B981',
    bg: '#DBEAFE', fg: '#1E40AF',
    statusLabel: 'Arriving Soon', statusColor: '#10B981', statusBgColor: '#D1FAE5',
    actionText: 'Confirm Delivery', actionColor: '#10B981',
  },
  delayed: {
    icon: 'triangle-exclamation', iconColor: '#F59E0B',
    bg: '#FEF3C7', fg: '#92400E',
    statusLabel: 'Delayed', statusColor: '#F59E0B', statusBgColor: '#FEF3C7',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
  out_for_delivery: {
    icon: 'truck', iconColor: '#A855F7',
    bg: '#F3E8FF', fg: '#7C3AED',
    statusLabel: 'Out for Delivery', statusColor: '#A855F7', statusBgColor: '#F3E8FF',
    actionText: 'Track Live', actionColor: '#3B82F6',
  },
  unknown: {
    icon: 'location-dot', iconColor: '#6B7280',
    bg: '#F3F4F6', fg: '#6B7280',
    statusLabel: 'Unknown', statusColor: '#6B7280', statusBgColor: '#F3F4F6',
    actionText: 'View Details', actionColor: '#3B82F6',
  },
};

export function getStatusMeta(status) {
  const key = (status || 'unknown').toLowerCase().replace(/[\s-]/g, '_');
  return STATUS_META[key] || STATUS_META.unknown;
}
