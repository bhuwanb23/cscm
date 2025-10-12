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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLogin({ email, password, role: userRole });
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="storefront" size={60} color="#4A90E2" />
            <Text style={styles.title}>CSCM Login</Text>
            <Text style={styles.subtitle}>Cognitive Supply Chain Mesh</Text>
          </View>

          <View style={styles.form}>
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
                    size={24} 
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
                    size={24} 
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
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            {/* Password Input */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
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
    padding: 20,
  },
  card: {
    elevation: 8,
    borderRadius: 20,
    padding: 30,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
  },
  form: {
    gap: 20,
  },
  roleContainer: {
    marginBottom: 10,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  roleOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  roleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  roleTextSelected: {
    color: '#4A90E2',
  },
  input: {
    backgroundColor: '#FAFAFA',
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginForm;
