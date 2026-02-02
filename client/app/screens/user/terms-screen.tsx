/**
 * Terms & Conditions Screen
 * 
 * Displays terms and conditions
 */

import { router } from 'expo-router';
import { ArrowLeft01Icon } from 'hugeicons-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TermsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Terms & Conditions</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</ThemedText>

        <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
        <ThemedText style={styles.paragraph}>
          By accessing and using the TowMe application, you accept and agree to be bound by the terms and provision of this agreement.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>2. Service Description</ThemedText>
        <ThemedText style={styles.paragraph}>
          TowMe is a platform that connects vehicle owners with tow truck operators. We facilitate the connection but are not a party to the actual towing service agreement between users and operators.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>3. User Responsibilities</ThemedText>
        <ThemedText style={styles.paragraph}>
          Users are responsible for:
        </ThemedText>
        <ThemedText style={styles.listItem}>• Providing accurate location and vehicle information</ThemedText>
        <ThemedText style={styles.listItem}>• Being present at the pickup location at the agreed time</ThemedText>
        <ThemedText style={styles.listItem}>• Ensuring payment is made for services rendered</ThemedText>
        <ThemedText style={styles.listItem}>• Treating operators with respect and courtesy</ThemedText>

        <ThemedText style={styles.sectionTitle}>4. Pricing and Payment</ThemedText>
        <ThemedText style={styles.paragraph}>
          Pricing is calculated based on distance and vehicle type. Final pricing may vary based on actual distance traveled. Payment must be completed upon service completion.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>5. Cancellation Policy</ThemedText>
        <ThemedText style={styles.paragraph}>
          Users may cancel requests before operator acceptance without penalty. Cancellations after acceptance may incur fees. Operators may cancel due to safety concerns or vehicle incompatibility.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>6. Liability</ThemedText>
        <ThemedText style={styles.paragraph}>
          TowMe acts as an intermediary platform. We are not liable for damages to vehicles during towing. Operators are responsible for their services and must have appropriate insurance.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>7. Privacy</ThemedText>
        <ThemedText style={styles.paragraph}>
          Your personal information is protected according to our Privacy Policy. Location data is only shared with assigned operators during active trips.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>8. Prohibited Uses</ThemedText>
        <ThemedText style={styles.paragraph}>
          Users may not use the service for illegal purposes, provide false information, or abuse the platform. Violations may result in account suspension.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>9. Modifications</ThemedText>
        <ThemedText style={styles.paragraph}>
          TowMe reserves the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>10. Contact</ThemedText>
        <ThemedText style={styles.paragraph}>
          For questions about these terms, please contact our support team through the app or email support@towme.com
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
});

