/**
 * User Chat Screen
 * 
 * Detailed chat interface between client and tow operator.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCurrentUser } from '@/lib/api';
import { getRequestById, TowingRequest } from '@/lib/api/requests';
import {
    getMessagesByRequest,
    Message,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages
} from '@/lib/services/chatService';

export default function UserChatScreen() {
    const params = useLocalSearchParams<{ requestId: string, operatorName?: string, operatorPhone?: string }>();
    const [request, setRequest] = useState<TowingRequest | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);

    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const inputBg = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'background');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        let channel: any = null;

        const initChat = async () => {
            if (!params.requestId) {
                setIsLoading(false);
                return;
            }

            try {
                // Get current user (client)
                const user = await getCurrentUser();
                if (user) setCurrentUserId(user.id);

                // Load request and messages
                const [requestData, messagesData] = await Promise.all([
                    getRequestById(params.requestId),
                    getMessagesByRequest(params.requestId)
                ]);

                setRequest(requestData);
                setMessages(messagesData.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                ));

                // Subscribe to new messages
                channel = subscribeToMessages(params.requestId, (newMessage) => {
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                });

            } catch (error) {
                console.error('Failed to initialize chat:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initChat();

        return () => {
            if (channel) unsubscribeFromMessages(channel);
        };
    }, [params.requestId]);

    const handleSend = async () => {
        if (!inputText.trim() || !currentUserId || isSending) return;

        if (!request && !params.requestId) {
            Alert.alert('Error', 'No active request found.');
            return;
        }

        const requestId = request?.id || params.requestId;
        const receiverId = request?.operatorId || ''; // This should be the operator's ID

        if (!receiverId) {
            // If we don't have operatorId yet (e.g. still searching), we can't send
            Alert.alert('Info', 'Waiting for an operator to accept your request before you can chat.');
            return;
        }

        const content = inputText.trim();
        setInputText('');
        setIsSending(true);

        try {
            const newMessage = await sendMessage({
                requestId,
                receiverId,
                content
            });
            setMessages((prev) => [...prev, newMessage]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error: any) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message. Please ensure your backend is running.');
            setInputText(content);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === currentUserId;

        return (
            <View style={[
                styles.messageWrapper,
                isMe ? styles.myMessageWrapper : styles.theirMessageWrapper
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMe ? [styles.myMessageBubble, { backgroundColor: tintColor }] : [styles.theirMessageBubble, { backgroundColor: inputBg }]
                ]}>
                    <ThemedText style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : styles.theirMessageText
                    ]}>
                        {item.content}
                    </ThemedText>
                </View>
                <ThemedText style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
            </View>
        );
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
            </ThemedView>
        );
    }

    const headerName = request?.operator?.fullName || params.operatorName || 'Operator';
    const phoneToCall = request?.operator?.phone || params.operatorPhone;

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={textColor} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>{headerName}</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Vehicle Towing</ThemedText>
                    </View>

                    {phoneToCall && (
                        <TouchableOpacity
                            style={[styles.callButton, { backgroundColor: '#dcfce7' }]}
                            onPress={() => Linking.openURL(`tel:${phoneToCall}`)}
                        >
                            <Ionicons name="call" size={20} color="#10B981" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={styles.inputContainer}>
                        <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="Type a message..."
                                placeholderTextColor="#9ca3af"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: tintColor }]}
                                onPress={handleSend}
                                disabled={!inputText.trim() || isSending}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="send" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageList: {
        padding: 20,
        paddingBottom: 10,
    },
    messageWrapper: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessageWrapper: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    theirMessageWrapper: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 4,
    },
    myMessageBubble: {
        borderBottomRightRadius: 4,
    },
    theirMessageBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#1f2937',
    },
    timestamp: {
        fontSize: 10,
        color: '#9ca3af',
    },
    inputContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingTop: Platform.OS === 'ios' ? 8 : 4,
        paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
});
