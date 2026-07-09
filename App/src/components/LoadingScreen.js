import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme/tokens';

export function LoadingScreen({ message = 'Loading…', testID = 'loading-screen' }) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.center} testID={testID}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </LinearGradient>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string,
  testID: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
