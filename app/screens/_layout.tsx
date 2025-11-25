import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/login-screen" />
      <Stack.Screen name="auth/register-screen" />
    </Stack>
  );
}
