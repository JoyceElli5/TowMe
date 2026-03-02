import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/auth-method-screen" />
      <Stack.Screen name="auth/login-screen" />
      <Stack.Screen name="auth/phone-login-screen" />
      <Stack.Screen name="auth/otp-verify-screen" />
      <Stack.Screen name="auth/register-screen" />
      <Stack.Screen name="auth/forgot-password-screen" />
      <Stack.Screen name="auth/reset-password-screen" />
      <Stack.Screen name="user" />
      <Stack.Screen name="operator" />
    </Stack>
  );
}
