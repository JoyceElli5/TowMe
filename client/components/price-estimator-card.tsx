/**
 * PriceEstimatorCard Component
 * 
 * Displays the estimated price dynamically based on vehicle type and distance.
 * Features a large, bold price with a descriptive caption.
 */

import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

interface PriceEstimatorCardProps {
  /** Estimated price value */
  estimatedPrice: number | null;
  /** Currency symbol */
  currency?: string;
  /** Whether price is being calculated */
  isCalculating?: boolean;
}

export default function PriceEstimatorCard({
  estimatedPrice,
  currency = 'GH₵',
  isCalculating = false,
}: PriceEstimatorCardProps) {
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const dividerColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'background');
  const priceColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  return (
    <ThemedView style={[styles.container, { borderColor }]}>
      <View style={styles.priceContainer}>
        <ThemedText style={styles.label}>Estimated Cost</ThemedText>
        
        {isCalculating ? (
          <View style={styles.calculatingContainer}>
            <ThemedText style={styles.calculatingText}>Calculating...</ThemedText>
          </View>
        ) : estimatedPrice !== null ? (
          <View style={styles.priceRow}>
            <ThemedText style={[styles.currency, { color: priceColor }]}>{currency}</ThemedText>
            <ThemedText style={[styles.priceValue, { color: priceColor }]}>{formatPrice(estimatedPrice)}</ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.noPriceText}>Select vehicle & locations</ThemedText>
        )}
        
        <ThemedText style={styles.caption}>
          Estimated cost based on route & vehicle type
        </ThemedText>
      </View>

      {/* Price breakdown hint */}
      {estimatedPrice !== null && !isCalculating && (
        <View style={[styles.breakdownHint, { borderTopColor: dividerColor }]}>
          <ThemedText style={styles.breakdownIcon}>ℹ️</ThemedText>
          <ThemedText style={styles.breakdownText}>
            Final price may vary based on actual distance and conditions
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
  priceContainer: {
    alignItems: 'center',
    overflow: 'visible',
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    minHeight: 48,
    justifyContent: 'center',
    overflow: 'visible',
  },
  currency: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginRight: 4,
    lineHeight: 28,
  },
  priceValue: {
    fontSize: 36,
    fontFamily: Fonts.semiBold,
    lineHeight: 44,
  },
  noPriceText: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  calculatingContainer: {
    marginBottom: 8,
  },
  calculatingText: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },
  caption: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  breakdownHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  breakdownIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 1,
  },
  breakdownText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
});
