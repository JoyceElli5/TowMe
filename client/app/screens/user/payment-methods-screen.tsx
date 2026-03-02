/**
 * Payment Methods Screen
 * 
 * Manage payment methods
 */

import { router } from 'expo-router';
import { ArrowLeft01Icon, CreditCardIcon, SmartPhone01Icon, Wallet01Icon } from 'hugeicons-react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'mobile_money';
  name: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  // Mock payment methods - in real app, fetch from API
  const [paymentMethods] = React.useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'mobile_money',
      name: 'Mobile Money',
      details: '024 ••• ••89',
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      name: 'Bank Account',
      details: '•••• 4532',
      isDefault: false,
    },
  ]);

  const handleAddMethod = () => {
    showToast('Payment method management coming soon', 'info');
  };

  const handleSetDefault = (id: string) => {
    showToast('Default payment method updated', 'success');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return CreditCardIcon;
      case 'mobile_money':
        return SmartPhone01Icon;
      default:
        return Wallet01Icon;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Payment Methods</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.intro}>
          Manage your payment methods for faster checkout
        </ThemedText>

        {paymentMethods.map((method) => {
          const Icon = getIcon(method.type);
          return (
            <ThemedView
              key={method.id}
              style={[styles.methodCard, { borderColor }]}
            >
              <View style={styles.methodContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${tintColor}15` }]}>
                  <Icon size={24} color={tintColor} strokeWidth={2} />
                </View>
                <View style={styles.methodInfo}>
                  <ThemedText style={styles.methodName}>{method.name}</ThemedText>
                  <ThemedText style={styles.methodDetails}>{method.details}</ThemedText>
                </View>
                {method.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: `${tintColor}15` }]}>
                    <ThemedText style={[styles.defaultText, { color: tintColor }]}>Default</ThemedText>
                  </View>
                )}
              </View>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <ThemedText style={[styles.setDefaultText, { color: tintColor }]}>Set as Default</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { borderColor }]}
          onPress={handleAddMethod}
        >
          <Ionicons name="add" size={20} color={tintColor} />
          <ThemedText style={[styles.addButtonText, { color: tintColor }]}>Add Payment Method</ThemedText>
        </TouchableOpacity>
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
  intro: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  methodCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  defaultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

