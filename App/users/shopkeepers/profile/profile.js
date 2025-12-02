import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import ShopkeeperProfileHeader from './components/ShopkeeperProfileHeader';
import ShopInformation from './components/ShopInformation';
import PerformanceOverview from './components/PerformanceOverview';
import InventoryMeshStatus from './components/InventoryMeshStatus';
import SalesDemandInsights from './components/SalesDemandInsights';
import ComplianceRisk from './components/ComplianceRisk';
import TeamMembers from './components/TeamMembers';
import SettingsIntegrations from './components/SettingsIntegrations';
import Notifications from './components/Notifications';

// Hooks
import { useShopkeeperData } from './hooks/useShopkeeperData';
import { useNotification } from './hooks/useNotification';

const Profile = ({ onLogout }) => { // Add onLogout prop
  const {
    shopkeeperProfile,
    shopInformation,
    performanceMetrics,
    inventoryMeshStatus,
    salesInsights,
    complianceRisk,
    teamMembers,
    settingsIntegrations
  } = useShopkeeperData();
  
  const { notifications, showNotification, removeNotification } = useNotification();

  const handleEditProfile = () => {
    showNotification('Profile edit functionality would open here', 'info');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <Notifications 
              key={notification.id} 
              notification={notification} 
              onDismiss={removeNotification} 
            />
          ))}
          <ShopkeeperProfileHeader 
            shopkeeperProfile={shopkeeperProfile} 
            onEditProfile={handleEditProfile} 
          />
          <ShopInformation shopInformation={shopInformation} />
          <PerformanceOverview performanceMetrics={performanceMetrics} />
          <InventoryMeshStatus inventoryMeshStatus={inventoryMeshStatus} />
          <SalesDemandInsights salesInsights={salesInsights} />
          <ComplianceRisk complianceRisk={complianceRisk} />
          <TeamMembers teamMembers={teamMembers} />
          <SettingsIntegrations settingsIntegrations={settingsIntegrations} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
});

export default Profile;