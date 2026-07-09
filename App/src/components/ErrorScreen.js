import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme/tokens';

export function ErrorScreen({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Retry',
  testID = 'error-screen',
}) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.center} testID={testID}>
        <Text style={styles.icon}>!</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

ErrorScreen.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  testID: PropTypes.string,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  icon: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.danger,
    width: 80,
    height: 80,
    lineHeight: 80,
    textAlign: 'center',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '600',
  },
});
