/**
 * Safe navigation helpers to prevent "go back error" when there is no
 * previous screen in the stack.
 */
import { router } from 'expo-router';

/**
 * Go back if possible, otherwise replace with the given fallback route.
 */
export function safeBack(fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}

/**
 * Operator-specific safe back that falls back to the operator dashboard.
 */
export function operatorSafeBack() {
  safeBack('/operator/(tabs)/dashboard');
}
