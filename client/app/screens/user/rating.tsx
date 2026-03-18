/**
 * Rating Screen
 *
 * Allows users to rate the tow operator after trip completion.
 * Features a 5-star rating system and optional comment.
 * Uses KeyboardAvoidingView so the submit button is never hidden by the keyboard.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { safeBack } from '@/lib/navigation';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

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
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

  const loadRequest = React.useCallback(async () => {
    if (!requestId) return;
    try {
      setIsLoading(true);
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch (error) {
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
      safeBack('/(tabs)');
    }
  }, [requestId, loadRequest, showToast]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating first', 'error');
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
      showToast('Rating submitted — thank you!', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to submit rating', 'error');
      } else {
        showToast('Failed to submit rating', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003554" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!request || !request.operator) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>Operator information not available</ThemedText>
          <TouchableOpacity style={styles.backBtn} onPress={() => safeBack('/(tabs)')}>
            <Text style={styles.backBtnText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Operator Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(request.operator.fullName)}</Text>
            </View>
            <ThemedText style={styles.operatorName}>{request.operator.fullName}</ThemedText>
            <ThemedText style={styles.subtitle}>How was your experience?</ThemedText>
          </View>

          {/* Star Rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? '#fbbf24' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating label */}
          <ThemedText style={[styles.ratingLabel, rating > 0 && styles.ratingLabelActive]}>
            {rating === 0 ? 'Tap a star to rate' : RATING_LABELS[rating]}
          </ThemedText>

          {/* Comment */}
          <TextInput
            style={[styles.commentInput, { backgroundColor: inputBg, borderColor, color: '#111827' }]}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (rating === 0 || isSubmitting) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Rating</Text>
            )}
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontFamily: 'Gilroy-Bold', color: '#ffffff' },
  operatorName: { fontSize: 22, fontFamily: 'Gilroy-Bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Gilroy-Regular', color: '#6b7280' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ratingLabel: {
    fontSize: 17,
    fontFamily: 'Gilroy-Medium',
    color: '#9ca3af',
    marginBottom: 28,
  },
  ratingLabelActive: { color: '#003554', fontFamily: 'Gilroy-SemiBold' },
  commentInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
    borderWidth: 1.5,
    minHeight: 110,
    marginBottom: 24,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 16, fontFamily: 'Gilroy-SemiBold', color: '#ffffff' },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 32 },
  skipBtnText: { fontSize: 15, fontFamily: 'Gilroy-Medium', color: '#9ca3af' },
  loadingText: { marginTop: 12, fontSize: 15, fontFamily: 'Gilroy-Regular', color: '#6b7280' },
  errorText: { fontSize: 15, fontFamily: 'Gilroy-Medium', color: '#ef4444', textAlign: 'center', marginBottom: 20 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#003554', borderRadius: 28 },
  backBtnText: { color: '#ffffff', fontSize: 15, fontFamily: 'Gilroy-SemiBold' },
});
