/**
 * Rate User Screen (Placeholder)
 * 
 * Allows operator to rate the customer after trip completion.
 * Features a star rating system and optional comment.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RateUserScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    // Submit rating (mock)
    console.log('Rating submitted:', { rating, comment });
    router.replace('/screens/operator/dashboard');
  };

  const handleSkip = () => {
    router.replace('/screens/operator/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Customer Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SK</Text>
          </View>
          <Text style={styles.customerName}>Sarah Kofi</Text>
          <Text style={styles.subtitle}>How was your customer?</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.star,
                  star <= rating && styles.starSelected,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating Label */}
        <Text style={styles.ratingLabel}>
          {rating === 0 && 'Tap to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent!'}
        </Text>

        {/* Comment Input */}
        <View style={styles.commentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#003554',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  star: {
    fontSize: 48,
    color: '#e5e7eb',
  },
  starSelected: {
    color: '#fbbf24',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 32,
  },
  commentContainer: {
    width: '100%',
    marginBottom: 32,
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});
