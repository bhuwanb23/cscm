import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginForm from './components/LoginForm';

const LoginScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (loginData) => {
    setIsLoading(true);
    
    try {
      // Simulate authentication
      console.log('Login attempt:', loginData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate based on role
      if (loginData.role === 'shopkeeper') {
        // Navigate to shopkeeper dashboard
        Alert.alert('Success', 'Welcome, Shopkeeper!', [
          { text: 'OK', onPress: () => console.log('Navigate to shopkeeper dashboard') }
        ]);
      } else if (loginData.role === 'transporter') {
        // Navigate to transporter dashboard
        Alert.alert('Success', 'Welcome, Transporter!', [
          { text: 'OK', onPress: () => console.log('Navigate to transporter dashboard') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PaperProvider>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2C5AA0']}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <LoginForm onLogin={handleLogin} />
        </View>
      </LinearGradient>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default LoginScreen;
