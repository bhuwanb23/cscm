import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginForm from './components/LoginForm';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start with subtle entrance animations
    slideAnim.setValue(-10);
    scaleAnim.setValue(0.98);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Background animation loop
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    return () => rotateLoop.stop();
  }, []);

  const handleLogin = async (loginData) => {
    setIsLoading(true);
    
    try {
      // Simulate authentication
      console.log('Login attempt:', loginData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Directly navigate based on role without alerts
      onLogin(loginData);
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <PaperProvider>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        <Animated.View 
          style={[
            styles.floatingElement1,
            {
              transform: [
                { rotate: rotateInterpolate },
                { scale: scaleAnim },
              ],
              opacity: 0.1,
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingElement2,
            {
              transform: [
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  })
                },
                { scale: scaleAnim },
              ],
              opacity: 0.08,
            }
          ]}
        />

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.overlay,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          <LoginForm onLogin={handleLogin} isLoading={isLoading} />
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  floatingElement1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  floatingElement2: {
    position: 'absolute',
    bottom: height * 0.15,
    left: width * 0.05,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
  },
});

export default LoginScreen;
