import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorView } from './error-view';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1 }}>
                    <ErrorView
                        type="critical"
                        title="Error!"
                        message="The app encountered an unexpected error and needs to remain stable. Please try reloading."
                        onRetry={this.handleReset}
                        retryLabel="TRY AGAIN"
                        showBackButton={false}
                    />
                </View>
            );
        }

        return this.props.children;
    }
}
