/**
 * PriceEstimatorCard Component
 * 
 * Displays the estimated price dynamically based on vehicle type and distance.
 * Features a large, bold price with a descriptive caption.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

  return (
    <View style={styles.container}>
      <View style={styles.priceContainer}>
        <Text style={styles.label}>Estimated Cost</Text>
        
        {isCalculating ? (
          <View style={styles.calculatingContainer}>
            <Text style={styles.calculatingText}>Calculating...</Text>
          </View>
        ) : estimatedPrice !== null ? (
          <View style={styles.priceRow}>
            <Text style={styles.currency}>{currency}</Text>
            <Text style={styles.priceValue}>{formatPrice(estimatedPrice)}</Text>
          </View>
        ) : (
          <Text style={styles.noPriceText}>Select vehicle & locations</Text>
        )}
        
        <Text style={styles.caption}>
          Estimated cost based on route & vehicle type
        </Text>
      </View>

      {/* Price breakdown hint */}
      {estimatedPrice !== null && !isCalculating && (
        <View style={styles.breakdownHint}>
          <Text style={styles.breakdownIcon}>ℹ️</Text>
          <Text style={styles.breakdownText}>
            Final price may vary based on actual distance and conditions
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#003554',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#003554',
  },
  noPriceText: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
  },
  calculatingContainer: {
    marginBottom: 8,
  },
  calculatingText: {
    fontSize: 18,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  caption: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  breakdownHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  breakdownIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 1,
  },
  breakdownText: {
    flex: 1,
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 16,
  },
});
