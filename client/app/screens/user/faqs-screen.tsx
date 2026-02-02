/**
 * FAQs Screen
 * 
 * Displays frequently asked questions and answers
 */

import { router } from 'expo-router';
import { ArrowLeft01Icon } from 'hugeicons-react-native';
import React, { useState } from 'react';
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

interface FAQ {
  question: string;
  answer: string;
}

const FAQs: FAQ[] = [
  {
    question: 'How do I request a tow truck?',
    answer: 'Open the app, select your pickup and destination locations, choose your vehicle type, and tap "Request Tow Truck". We\'ll match you with the nearest available operator.',
  },
  {
    question: 'How is the price calculated?',
    answer: 'Pricing is based on distance and vehicle type. Each vehicle type has a different multiplier. The base rate is GH₵15 per kilometer with a minimum fare of GH₵50.',
  },
  {
    question: 'How long does it take for an operator to arrive?',
    answer: 'Typically, operators arrive within 10-20 minutes depending on your location and traffic conditions. You can track the operator in real-time once they accept your request.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept Mobile Money, Bank transfers, and Cash payments. You can set your preferred payment method in your profile settings.',
  },
  {
    question: 'Can I cancel a request?',
    answer: 'Yes, you can cancel a request before an operator accepts it. Once accepted, cancellation may incur a fee. Go to your active request and tap "Cancel Request".',
  },
  {
    question: 'What if I need to change my destination?',
    answer: 'You can contact the operator directly through the app or call them. Additional charges may apply if the new destination is significantly further.',
  },
  {
    question: 'How do I rate my experience?',
    answer: 'After your trip is completed, you\'ll be prompted to rate the operator. You can also rate from your trip history in the profile section.',
  },
  {
    question: 'What vehicle types are supported?',
    answer: 'We support Motorcycles, Cars, Saloons, SUVs, Vans, Trucks, and other vehicle types. Select the appropriate type when making a request.',
  },
  {
    question: 'Is my location shared with operators?',
    answer: 'Your location is only shared with the assigned operator during an active trip for navigation purposes. You can control location sharing in Privacy settings.',
  },
  {
    question: 'How do I add or remove vehicles?',
    answer: 'Go to Profile > My Vehicles. Tap "Add Vehicle" to add a new vehicle or tap on an existing vehicle to edit or delete it.',
  },
];

export default function FAQsScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>FAQs</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.intro}>
          Find answers to common questions about using TowMe
        </ThemedText>

        {FAQs.map((faq, index) => (
          <ThemedView
            key={index}
            style={[styles.faqCard, { borderColor }]}
          >
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.question}>{faq.question}</ThemedText>
              <ThemedText style={styles.expandIcon}>
                {expandedIndex === index ? '−' : '+'}
              </ThemedText>
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <ThemedText style={styles.answer}>{faq.answer}</ThemedText>
              </View>
            )}
          </ThemedView>
        ))}
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
  },
  intro: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#003554',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    opacity: 0.8,
  },
});

