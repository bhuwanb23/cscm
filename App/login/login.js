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
      // Login attempt removed: real auth deferred (issue 5.2)
      
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
        style={styles.fullScreen}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingElement1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
  },
  floatingElement2: {
    position: 'absolute',
    bottom: height * 0.15,
    left: width * 0.05,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
  },
});

export default LoginScreen;