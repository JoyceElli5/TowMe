/**
 * Chat dynamic route – redirects to the proper chat screen.
 * The main chat UI lives in /screens/user/chat-screen (user)
 * and /screens/operator/chat-screen (operator).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function ChatRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace({
        pathname: '/screens/user/chat-screen',
        params: { requestId: id },
      });
    } else {
      router.replace('/(tabs)/messages');
    }
  }, [id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
