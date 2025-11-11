import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Card, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LoginForm = ({ onLogin, isLoading: parentLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('shopkeeper');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Icon rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // Pulse animation for demo notice
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    
    // Simulate API call - no validation needed for demo
    setTimeout(() => {
      setLoading(false);
      onLogin({ 
        email: email || `${userRole}@cscm.com`, 
        password: password || 'demo123', 
        role: userRole 
      });
    }, 1000);
  };

  const handleRolePress = (role) => {
    // Add press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setUserRole(role);
  };

  const iconRotateInterpolate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header with animated icon */}
            <Animated.View style={styles.header}>
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.iconContainer}
              >
                <Animated.View
                  style={{
                    transform: [{ rotate: iconRotateInterpolate }],
                  }}
                >
                  <Ionicons name="storefront" size={32} color="#FFFFFF" />
                </Animated.View>
              </LinearGradient>
              <Text style={styles.title}>CSCM</Text>
              <Text style={styles.subtitle}>Cognitive Supply Chain Mesh</Text>
              <View style={styles.decorativeLine} />
            </Animated.View>

            <View style={styles.form}>
              {/* Demo Notice with pulse animation */}
              <Animated.View 
                style={[
                  styles.demoNotice,
                  {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <LinearGradient
                  colors={['#EBF4FF', '#DBEAFE']}
                  style={styles.demoGradient}
                >
                  <Ionicons name="information-circle" size={16} color="#3B82F6" />
                  <Text style={styles.demoText}>Demo Mode: Select role and click Sign In</Text>
                </LinearGradient>
              </Animated.View>

              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Select Your Role:</Text>
                <View style={styles.roleOptions}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      userRole === 'shopkeeper' && styles.roleOptionSelected
                    ]}
                    onPress={() => handleRolePress('shopkeeper')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={userRole === 'shopkeeper' ? ['#3B82F6', '#1E40AF'] : ['#F9FAFB', '#F3F4F6']}
                      style={styles.roleGradient}
                    >
                      <Ionicons 
                        name="storefront-outline" 
                        size={18} 
                        color={userRole === 'shopkeeper' ? '#FFFFFF' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.roleText,
                        userRole === 'shopkeeper' && styles.roleTextSelected
                      ]}>
                        Shopkeeper
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      userRole === 'transporter' && styles.roleOptionSelected
                    ]}
                    onPress={() => handleRolePress('transporter')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={userRole === 'transporter' ? ['#3B82F6', '#1E40AF'] : ['#F9FAFB', '#F3F4F6']}
                      style={styles.roleGradient}
                    >
                      <Ionicons 
                        name="car-outline" 
                        size={18} 
                        color={userRole === 'transporter' ? '#FFFFFF' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.roleText,
                        userRole === 'transporter' && styles.roleTextSelected
                      ]}>
                        Transporter
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Email (Optional)"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" size={16} />}
                  placeholder="Leave empty for demo"
                  dense
                  theme={{
                    colors: {
                      primary: '#3B82F6',
                      outline: '#D1D5DB',
                    },
                  }}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Password (Optional)"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" size={16} />}
                  placeholder="Leave empty for demo"
                  dense
                  theme={{
                    colors: {
                      primary: '#3B82F6',
                      outline: '#D1D5DB',
                    },
                  }}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      size={16}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButtonWrapper}
                onPress={handleLogin}
                disabled={loading || parentLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1E40AF']}
                  style={styles.loginButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {(loading || parentLoading) ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View
                        style={[
                          styles.loadingDot,
                          {
                            transform: [{ rotate: iconRotateInterpolate }],
                          }
                        ]}
                      >
                        <Ionicons name="refresh" size={18} color="#FFFFFF" />
                      </Animated.View>
                      <Text style={styles.loginButtonText}>Signing In...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="log-in" size={18} color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                <Ionicons name="arrow-forward" size={12} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: '100%',
  },
  cardWrapper: {
    maxWidth: 380,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 20,
    padding: 28,
    elevation: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 12,
  },
  form: {
    gap: 18,
  },
  demoNotice: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  demoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    flex: 1,
  },
  roleContainer: {
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    fontSize: 14,
  },
  loginButtonWrapper: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LoginForm;
