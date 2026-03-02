/**
 * User Screens Layout
 * 
 * Stack navigator for all user-related screens.
 */

import { Stack } from 'expo-router';

export default function UserScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home-screen" />
      <Stack.Screen name="searching-operator" />
      <Stack.Screen name="operator-found" />
      <Stack.Screen
        name="live-tracking"
        options={{
          // Show the "operator en route" experience as a modal over the map flow
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="trip-completed" />
      <Stack.Screen name="chat-screen" />
      <Stack.Screen name="rating" />
    </Stack>
  );
}
