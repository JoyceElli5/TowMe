/**
 * Rating Screen (Placeholder)
 * 
 * Allows users to rate the tow operator after trip completion.
 * Features a star rating system and optional comment.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { ApiError, createRating, getRequestById, type TowingRequest } from '@/lib/api';

export default function RatingScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId;
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');

  const loadRequest = React.useCallback(async () => {
    if (!requestId) return;

    try {
      setIsLoading(true);
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load request details', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [requestId, showToast]);

  useEffect(() => {
    if (requestId) {
      loadRequest();
    } else {
      showToast('Request ID not found', 'error');
      router.back();
    }
  }, [requestId, loadRequest, showToast]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!requestId || !request?.operatorId) {
      showToast('Invalid request data', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRating({
        requestId,
        toUserId: request.operatorId,
        rating,
        comment: comment.trim() || undefined,
      });
      showToast('Rating submitted successfully!', 'success');
      router.replace('/screens/user/home-screen');
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to submit rating', 'error');
      } else {
        showToast('Failed to submit rating', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/screens/user/home-screen');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <ThemedText style={styles.loadingText}>Loading operator details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!request || !request.operator) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Operator information not available</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Operator Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(request.operator.fullName)}</Text>
          </View>
          <ThemedText style={styles.operatorName}>{request.operator.fullName}</ThemedText>
          <ThemedText style={styles.subtitle}>How was your experience?</ThemedText>
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
        <ThemedText style={styles.ratingLabel}>
          {rating === 0 && 'Tap to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent!'}
        </ThemedText>

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
          style={[styles.submitButton, (rating === 0 || isSubmitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          )}
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
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  operatorName: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#003554',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
