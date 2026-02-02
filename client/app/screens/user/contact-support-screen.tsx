/**
 * Contact Support Screen
 * 
 * Allows users to contact support
 */

import { router } from 'expo-router';
import { ArrowLeft01Icon, Mail01Icon } from 'hugeicons-react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';

export default function ContactSupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const inputBg = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, this would send to your backend
      // For now, we'll open email client
      const email = 'support@towme.com';
      const emailSubject = encodeURIComponent(subject);
      const emailBody = encodeURIComponent(message);
      const mailtoUrl = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        showToast('Opening email client...', 'success');
        // Clear form after a delay
        setTimeout(() => {
          setSubject('');
          setMessage('');
        }, 1000);
      } else {
        Alert.alert(
          'Email Not Available',
          'Please contact us at support@towme.com or call +233 24 123 4567',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      showToast('Failed to open email client', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+233241234567').catch(() => {
      showToast('Unable to make phone call', 'error');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@towme.com').catch(() => {
      showToast('Unable to open email', 'error');
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Contact Support</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.intro}>
          Have a question or need help? Reach out to our support team.
        </ThemedText>

        {/* Quick Contact Options */}
        <View style={styles.quickContact}>
          <TouchableOpacity
            style={[styles.contactOption, { borderColor }]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={24} color={iconColor} />
            <ThemedText style={styles.contactLabel}>Call Us</ThemedText>
            <ThemedText style={styles.contactValue}>+233 24 123 4567</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactOption, { borderColor }]}
            onPress={handleEmail}
          >
            <Mail01Icon size={24} color={iconColor} strokeWidth={2} />
            <ThemedText style={styles.contactLabel}>Email Us</ThemedText>
            <ThemedText style={styles.contactValue}>support@towme.com</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <ThemedText style={styles.formTitle}>Send us a message</ThemedText>

        <ThemedView style={[styles.inputContainer, { borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
            placeholder="Subject"
            placeholderTextColor="#9ca3af"
            value={subject}
            onChangeText={setSubject}
          />
        </ThemedView>

        <ThemedView style={[styles.inputContainer, { borderColor }]}>
          <TextInput
            style={[styles.textArea, { color: textColor, backgroundColor: inputBg }]}
            placeholder="Your message..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </ThemedView>

        <PrimaryButton
          label="Send Message"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          disabled={!subject.trim() || !message.trim()}
        />
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
  quickContact: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  contactOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    opacity: 0.7,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
});

