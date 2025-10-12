import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Card, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('shopkeeper');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={40} color="#4A90E2" />
            </View>
            <Text style={styles.title}>CSCM</Text>
            <Text style={styles.subtitle}>Cognitive Supply Chain Mesh</Text>
          </View>

          <View style={styles.form}>
            {/* Demo Notice */}
            <View style={styles.demoNotice}>
              <Ionicons name="information-circle" size={14} color="#4A90E2" />
              <Text style={styles.demoText}>Demo Mode: Select role and click Sign In</Text>
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Select Your Role:</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    userRole === 'shopkeeper' && styles.roleOptionSelected
                  ]}
                  onPress={() => setUserRole('shopkeeper')}
                >
                  <Ionicons 
                    name="storefront-outline" 
                    size={20} 
                    color={userRole === 'shopkeeper' ? '#4A90E2' : '#666'} 
                  />
                  <Text style={[
                    styles.roleText,
                    userRole === 'shopkeeper' && styles.roleTextSelected
                  ]}>
                    Shopkeeper
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    userRole === 'transporter' && styles.roleOptionSelected
                  ]}
                  onPress={() => setUserRole('transporter')}
                >
                  <Ionicons 
                    name="car-outline" 
                    size={20} 
                    color={userRole === 'transporter' ? '#4A90E2' : '#666'} 
                  />
                  <Text style={[
                    styles.roleText,
                    userRole === 'transporter' && styles.roleTextSelected
                  ]}>
                    Transporter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Input */}
            <TextInput
              label="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" size={18} />}
              placeholder="Leave empty for demo"
              dense
            />

            {/* Password Input */}
            <TextInput
              label="Password (Optional)"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" size={18} />}
              placeholder="Leave empty for demo"
              dense
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  size={18}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: '100%',
  },
  card: {
    elevation: 12,
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  demoText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    flex: 1,
  },
  roleContainer: {
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  roleOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  roleText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  roleTextSelected: {
    color: '#4A90E2',
  },
  input: {
    backgroundColor: '#FAFAFA',
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    elevation: 2,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  loginButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default LoginForm;
