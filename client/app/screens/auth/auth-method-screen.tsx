import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SmartPhone01Icon, Mail01Icon } from 'hugeicons-react-native';
import { UserRole } from '@/schemas/auth';

export default function AuthMethodScreen() {
  const params = useLocalSearchParams<{ role?: UserRole }>();
  const role = params.role || 'vehicle_owner';
  const backgroundColor = useThemeColor({}, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

  const handlePhoneAuth = () => {
    router.push({
      pathname: '/screens/auth/phone-login-screen',
      params: { role },
    });
  };

  const handleEmailAuth = () => {
    router.push({
      pathname: '/screens/auth/login-screen',
      params: { role },
    });
  };

  const getRoleTitle = () => {
    return role === 'tow_operator' ? 'Tow Operator' : 'Vehicle Owner';
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Choose Login Method</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select how you want to sign in as a {getRoleTitle()}
          </ThemedText>

          <View style={styles.methodsContainer}>
            {/* Email/Password Option */}
            <TouchableOpacity
              style={[styles.methodCard, { borderColor, backgroundColor }]}
              onPress={handleEmailAuth}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${buttonColor}15` }]}>
                <Mail01Icon size={32} color={buttonColor} strokeWidth={2} />
              </View>
              <ThemedText style={styles.methodTitle}>Email & Password</ThemedText>
              <ThemedText style={styles.methodDescription}>
                Sign in with your email address and password
              </ThemedText>
              <View style={[styles.recommendedBadge, { backgroundColor: buttonColor }]}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            </TouchableOpacity>

            {/* Phone OTP Option */}
            <TouchableOpacity
              style={[styles.methodCard, { borderColor, backgroundColor, opacity: 0.6 }]}
              onPress={handlePhoneAuth}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${buttonColor}15` }]}>
                <SmartPhone01Icon size={32} color={buttonColor} strokeWidth={2} />
              </View>
              <ThemedText style={styles.methodTitle}>Phone Number</ThemedText>
              <ThemedText style={styles.methodDescription}>
                Sign in with your phone number via OTP
              </ThemedText>
              <View style={[styles.betaBadge, { borderColor }]}>
                <Text style={styles.betaText}>Requires SMS Setup</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  methodsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  methodCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
  },
  recommendedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  betaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  betaText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    opacity: 0.6,
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    opacity: 0.7,
  },
});

