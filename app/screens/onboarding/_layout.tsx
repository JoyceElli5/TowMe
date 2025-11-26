import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding-screen" />
      <Stack.Screen name="role-selection-screen" />
    </Stack>
  );
}
