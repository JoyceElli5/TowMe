import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Redirect to onboarding screens
  return <Redirect href="/screens/onboarding/onboarding-screen" />;
}
