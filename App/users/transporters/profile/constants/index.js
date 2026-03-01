export const PROFILE_CONSTANTS = {
  DRIVER_INFO_FIELDS: [
    'name',
    'driverId', 
    'email',
    'licenseNumber',
    'licenseExpiry',
    'phone',
    'emergencyContact',
    'experience',
    'preferredRoutes'
  ],
  
  VEHICLE_INFO_FIELDS: [
    'type',
    'registration',
    'capacity',
    'lastService',
    'nextService',
    'insuranceExpiry'
  ],
  
  SETTINGS_OPTIONS: [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: 'notifications-outline',
      iconColor: '#F59E0B'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Update your privacy settings',
      icon: 'shield-checkmark-outline',
      iconColor: '#10B981'
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and support',
      icon: 'help-circle-outline',
      iconColor: '#8B5CF6'
    }
  ]
};