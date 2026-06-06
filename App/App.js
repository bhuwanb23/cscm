import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider, ApiHealthGate } from './src/api/ApiProvider';
import LoginScreen from './login/login';
import ShopkeeperDashboard from './users/shopkeepers/shopkeepers';
import TransporterDashboard from './users/transporters/transporter';
import WholesalerDashboard from './users/wholesalers/wholesalers';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (loginData) => {
    setUser(loginData);
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (user.role === 'shopkeeper') {
      return <ShopkeeperDashboard onLogout={handleLogout} />;
    } else if (user.role === 'transporter') {
      return <TransporterDashboard onLogout={handleLogout} />;
    } else if (user.role === 'wholesaler') {
      return <WholesalerDashboard onLogout={handleLogout} />;
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <ApiProvider>
          <ApiHealthGate>
            <View style={styles.container}>
              <StatusBar style="auto" />
              {user ? renderDashboard() : <LoginScreen onLogin={handleLogin} />}
            </View>
          </ApiHealthGate>
        </ApiProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
