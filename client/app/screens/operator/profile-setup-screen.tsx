import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function OperatorProfileSetupScreen() {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Debug Profile Screen (Minimal)</Text>
      <TouchableOpacity
        onPress={() => {
          if (router) {
            router.back();
          } else {
            console.warn('Router not available');
          }
        }}
        style={{ padding: 15, backgroundColor: '#003554', borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
