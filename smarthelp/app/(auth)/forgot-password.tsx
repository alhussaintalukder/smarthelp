/**
 * Forgot password screen — send password reset email.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    forgotPassword(email.trim());
    setSent(true);
  };

  if (sent && !error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Ionicons name="mail-open-outline" size={60} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>
            Check Your Email
          </Text>
          <Text style={[styles.description, { color: colors.muted }]}>
            We{"'"}ve sent a password reset link to {email}. Check your inbox and
            follow the instructions.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={styles.centeredContent}>
        <Ionicons name="key-outline" size={60} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Reset Password
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          Enter your email address and we{"'"}ll send you a link to reset your
          password.
        </Text>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.inputBg },
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={colors.muted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />
        <Button
          title="Back to Login"
          onPress={() => router.back()}
          variant="outline"
          style={{ marginTop: 12 }}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    width: '100%',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
});
