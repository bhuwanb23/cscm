import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider, ApiHealthGate } from './src/api/ApiProvider';
import { getStoredUser, logout as authLogout } from './src/api/auth';
import LoginScreen from './login/login';
import ShopkeeperDashboard from './users/shopkeepers/shopkeepers';
import TransporterDashboard from './users/transporters/transporter';
import WholesalerDashboard from './users/wholesalers/wholesalers';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        // Ignore errors
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = (loginData) => {
    setUser(loginData);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (user.role === 'shopkeeper') {
      return <ShopkeeperDashboard onLogout={handleLogout} role={user.role} />;
    } else if (user.role === 'transporter') {
      return <TransporterDashboard onLogout={handleLogout} role={user.role} />;
    } else if (user.role === 'wholesaler') {
      return <WholesalerDashboard onLogout={handleLogout} role={user.role} />;
    }

    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <View style={styles.container} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

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
