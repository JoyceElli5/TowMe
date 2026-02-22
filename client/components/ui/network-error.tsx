import React from 'react';
import { View } from 'react-native';

import { ErrorView } from './error-view';

interface NetworkErrorProps {
    onRetry: () => void;
    isLoading?: boolean;
}

export function NetworkError({ onRetry, isLoading = false }: NetworkErrorProps) {
    return (
        <View style={{ flex: 1 }}>
            <ErrorView
                type="network"
                onRetry={onRetry}
                isLoading={isLoading}
                showBackButton={false}
            />
        </View>
    );
}
