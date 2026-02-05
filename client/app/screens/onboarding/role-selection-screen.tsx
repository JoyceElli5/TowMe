import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import LoadingSpinner from '@/components/loading-spinner';
import { ONBOARDING_IMAGES } from '@/constants/onboarding';
import { UserRole } from '@/schemas/auth';

const { width } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    if (!selectedRole) return;
    setIsLoading(true);
    try {
      router.push({
        pathname: '/screens/auth/auth-method-screen',
        params: { role: selectedRole },
      });
    } catch {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'vehicle_owner' as UserRole,
      title: 'Vehicle Owner',
      description: 'Request towing services for your vehicle',
      icon: 'car-sport-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'tow_operator' as UserRole,
      title: 'Tow Operator',
      description: 'Provide towing services to customers',
      icon: 'car-outline' as keyof typeof Ionicons.glyphMap,
    },
  ];

  return (
    <ImageBackground
      source={{ uri: ONBOARDING_IMAGES.roleSelection }}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay} />

      <View style={styles.contentContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={32} color="#ffffff" style={styles.logoIcon} />
          <Text style={styles.logo}>TowMe</Text>
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
                  <Ionicons name={role.icon} size={32} color="#003554" />
                </View>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
                {selectedRole === role.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
              <LoadingSpinner size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    marginRight: 12,
  },
  logo: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 36,
    color: '#ffffff',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 26,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Gilroy-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  roleCardSelected: {
    borderColor: '#003554',
    backgroundColor: '#ffffff',
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleTitle: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: 'Gilroy-Regular',
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  getStartedButton: {
    backgroundColor: '#003554',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
    elevation: 6,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minWidth: width * 0.6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Gilroy-SemiBold',
    color: '#ffffff',
    fontSize: 16,
  },
});
