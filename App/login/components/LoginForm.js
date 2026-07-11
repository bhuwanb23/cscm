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
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login, register } from '../../src/api/auth';

const { width } = Dimensions.get('window');

const ROLES = [
  { id: 'shopkeeper', label: 'Shopkeeper', icon: 'storefront' },
  { id: 'transporter', label: 'Transporter', icon: 'car' },
  { id: 'wholesaler', label: 'Wholesaler', icon: 'business' },
];

const LoginForm = ({ onLogin, isLoading: parentLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('shopkeeper');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    slideAnim.setValue(-10);
    scaleAnim.setValue(0.98);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const rotateLoop = Animated.loop(Animated.timing(iconRotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true }));
    rotateLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => { rotateLoop.stop(); pulseLoop.stop(); };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isRegistering) {
        result = await register(email.split('@')[0], email, password, userRole);
      } else {
        result = await login(email.split('@')[0], password);
      }

      if (result.ok) {
        onLogin({
          email: email,
          role: userRole,
          token: result.token,
          user: result.user,
        });
      } else {
        // Fallback to demo mode if API is not available
        Alert.alert(
          'Backend Not Available',
          'Using demo mode. Select a role and continue.',
          [
            {
              text: 'Use Demo Mode',
              onPress: () => {
                onLogin({
                  email: email || `demo@${userRole}.com`,
                  role: userRole,
                  token: null,
                  user: { username: email.split('@')[0] || 'demo', role: userRole },
                });
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      // Fallback to demo mode on network error
      Alert.alert(
        'Connection Error',
        'Cannot reach the backend. Use demo mode?',
        [
          {
            text: 'Use Demo Mode',
            onPress: () => {
              onLogin({
                email: email || `demo@${userRole}.com`,
                role: userRole,
                token: null,
                user: { username: email.split('@')[0] || 'demo', role: userRole },
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const iconRotateInterpolate = iconRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
          style={[styles.cardWrapper, { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
        >
          <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Animated.View style={styles.header}>
              <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.iconContainer}>
                <Animated.View style={{ transform: [{ rotate: iconRotateInterpolate }] }}>
                  <Ionicons name="cube" size={28} color="#FFFFFF" />
                </Animated.View>
              </LinearGradient>
              <Text style={styles.title}>CSCM</Text>
              <Text style={styles.subtitle}>Cognitive Supply Chain Mesh</Text>
              <View style={styles.decorativeLine} />
            </Animated.View>

            <View style={styles.form}>
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Your Role</Text>
                <View style={styles.roleOptions}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.roleOption, userRole === role.id && styles.roleOptionSelected]}
                      onPress={() => setUserRole(role.id)}
                      activeOpacity={0.8}
                    >
                      {userRole === role.id ? (
                        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.roleGradient}>
                          <Ionicons name={role.icon} size={14} color="#FFFFFF" />
                          <Text style={styles.roleTextSelected}>{role.label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.roleInactive}>
                          <Ionicons name={role.icon} size={14} color="#6B7280" />
                          <Text style={styles.roleText}>{role.label}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" size={14} />}
                  placeholder="your@email.com"
                  dense
                  theme={{ colors: { primary: '#3B82F6', outline: '#D1D5DB' } }}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" size={14} />}
                  placeholder="Enter password"
                  dense
                  theme={{ colors: { primary: '#3B82F6', outline: '#D1D5DB' } }}
                  right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} size={14} onPress={() => setShowPassword(!showPassword)} />}
                />
              </View>

              <TouchableOpacity
                style={styles.loginButtonWrapper}
                onPress={handleLogin}
                disabled={loading || parentLoading}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.loginButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {(loading || parentLoading) ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View style={[styles.loadingDot, { transform: [{ rotate: iconRotateInterpolate }] }]}>
                        <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      </Animated.View>
                      <Text style={styles.loginButtonText}>{isRegistering ? 'Creating Account...' : 'Signing In...'}</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="log-in" size={16} color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>
                        {isRegistering ? `Sign Up as ${ROLES.find(r => r.id === userRole).label}` : `Sign In as ${ROLES.find(r => r.id === userRole).label}`}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsRegistering(!isRegistering)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20, minHeight: '100%' },
  cardWrapper: { maxWidth: 340, alignSelf: 'center', width: '100%' },
  card: { borderRadius: 16, padding: 20, elevation: 10, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
  header: { alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', letterSpacing: 0.5, marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center', fontWeight: '500' },
  decorativeLine: { width: 50, height: 2, backgroundColor: '#3B82F6', borderRadius: 1, marginTop: 10 },
  form: { gap: 14 },
  roleContainer: { marginBottom: 4 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  roleOptions: { flexDirection: 'row', gap: 6 },
  roleOption: { flex: 1, borderRadius: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  roleOptionSelected: { borderColor: '#3B82F6' },
  roleGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 4 },
  roleInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 4, backgroundColor: '#F9FAFB' },
  roleText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  roleTextSelected: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  inputContainer: { marginBottom: 2 },
  input: { backgroundColor: '#F9FAFB', fontSize: 13 },
  loginButtonWrapper: { marginTop: 6, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  loginButton: { paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loginButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  loadingDot: { alignItems: 'center', justifyContent: 'center' },
  toggleButton: { alignItems: 'center', marginTop: 12 },
  toggleText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
});

export default LoginForm;
