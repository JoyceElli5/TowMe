import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        transform: [{ rotate: '0deg' }],
      }}>
      <Ionicons name="hand-left-outline" size={28} color="#111827" />
    </Animated.View>
  );
}
