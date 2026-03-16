import { router, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { getCurrentUser } from '@/lib/api';
import { getVerificationStatus } from '@/lib/services/operatorService';

export default function OperatorTabLayout() {
    const [isChecking, setIsChecking] = useState(true);
    const [isRejected, setIsRejected] = useState(false);

    useEffect(() => {
        checkVerificationGate();
    }, []);

    const checkVerificationGate = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.replace('/screens/auth/login-screen');
                return;
            }

            const status = await getVerificationStatus(user.id);

            if (status === 'rejected') {
                setIsRejected(true);
                router.replace('/screens/operator/verification-rejected');
                return;
            } else if (!status) {
                // Unknown status - send to profile setup
                router.replace('/screens/operator/profile-setup-screen');
                return;
            }
        } catch (error) {
            console.error('Verification gate check failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    if (isChecking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props) => <FloatingTabBar {...props} />}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'Earnings',
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Activity',
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                }}
            />
        </Tabs>
    );
}
