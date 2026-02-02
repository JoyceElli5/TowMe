import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function OperatorHistoryScreen() {
    return (
        <View style={styles.container}>
            <Text>Operator History Screen</Text>
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
