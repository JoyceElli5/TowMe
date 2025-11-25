import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { UserRole } from '@/schemas/auth';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    if (!selectedRole) return;
    setIsLoading(true);
    router.push({
      pathname: '/screens/auth/login-screen',
      params: { role: selectedRole },
    });
  };

  const roles = [
    {
      id: 'vehicle_owner' as UserRole,
      title: 'Vehicle Owner',
      description: 'Request towing services for your vehicle',
      icon: '🚗',
    },
    {
      id: 'tow_operator' as UserRole,
      title: 'Tow Operator',
      description: 'Provide towing services to customers',
      icon: '🚛',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Logo / Animation */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('@/assets/animations/tow-truck.json')}
          autoPlay
          loop
          style={{ width: 250, height: 250 }}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.messageContainer}>
          <Text style={styles.mainTitle}>Welcome to TowMe</Text>
          <Text style={styles.subtitle}>
            Your trusted towing companion.{'\n'}Select how you want to use the app.
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === role.id }}
              accessibilityLabel={role.title}
            >
              <View style={styles.roleIconContainer}>
                <Text style={styles.roleIcon}>{role.icon}</Text>
              </View>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
              {selectedRole === role.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.activeDot]} />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          disabled={isLoading || !selectedRole}
          style={[
            styles.getStartedButton,
            (isLoading || !selectedRole) && styles.buttonDisabled,
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Get Started"
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  animationContainer: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    flex: 0.6,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontWeight: '600',
    fontSize: 26,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Euclid-Circular-B',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Euclid-Circular-B',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: '#003554',
    backgroundColor: '#f0f9ff',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 28,
  },
  roleTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 6,
    height: 6,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#003554',
  },
  getStartedButton: {
    backgroundColor: '#003554',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: width * 0.6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '600',
    color: '#ffffff',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
