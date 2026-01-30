/**
 * Operator Screens Layout
 * 
 * Stack navigator for all operator-related screens.
 */

import { Stack } from 'expo-router';

export default function OperatorScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile-setup-screen" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="incoming-request" />
      <Stack.Screen name="navigation-to-pickup" />
      <Stack.Screen name="arrived-at-pickup" />
      <Stack.Screen name="towing-in-progress" />
      <Stack.Screen name="trip-completed" />
      <Stack.Screen name="rate-user" />
    </Stack>
  );
}
