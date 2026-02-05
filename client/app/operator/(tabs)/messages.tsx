import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function OperatorMessagesScreen() {
    return (
        <View style={styles.container}>
            <Text>Operator Messages Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
