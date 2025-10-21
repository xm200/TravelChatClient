import React, {useEffect, useState, useRef} from 'react';
import {SendMessage, Connect, GetHistory, Disconnect} from "../../../wailsjs/go/main/App.js";

const Chat = ({ chatName }) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [forceUpdate, setForceUpdate] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // useRef для хранения историй всех чатов
    const chatsHistoryRef = useRef({});

    // useRef для отслеживания текущего chatName
    const currentChatNameRef = useRef(chatName);

    // Обновляем ref при изменении chatName
    useEffect(() => {
        if (currentChatNameRef.current !== "") {
            Disconnect(chatName)
        }
        currentChatNameRef.current = chatName;
    }, [chatName]);

    // Инициализация истории для текущего чата
    useEffect(() => {
        if (chatName && !chatsHistoryRef.current[chatName]) {
            chatsHistoryRef.current[chatName] = [];
        }
    }, [chatName]);

    // Получаем историю для текущего чата
    const chatHistory = chatName ? chatsHistoryRef.current[chatName] || [] : [];

    // Функция для загрузки истории
    const loadChatHistory = async (chatNameToLoad) => {
        if (!chatNameToLoad) return;

        setIsLoading(true);
        try {
            console.log(`Loading history for chat: ${chatNameToLoad}`);
            const history = await GetHistory(chatNameToLoad);
            console.log("Received history:", history);

            if (Array.isArray(history)) {
                chatsHistoryRef.current[chatNameToLoad] = history;
                setForceUpdate(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!chatName) return;

        console.log(`Connecting to chat: ${chatName}`);

        const initializeChat = async () => {
            // Сначала загружаем историю
            await loadChatHistory(chatName);

            // Затем подключаемся к WebSocket
            Connect(chatName);
        };

        initializeChat();

        // Обработчик входящих сообщений
        const handleNewMessage = (message) => {
            console.log("New Message", message);

            // Проверяем, что сообщение для текущего чата
            if (message.chat === currentChatNameRef.current) {
                const currentChat = currentChatNameRef.current;
                if (!chatsHistoryRef.current[currentChat]) {
                    chatsHistoryRef.current[currentChat] = [];
                }

                chatsHistoryRef.current[currentChat] = [
                    ...chatsHistoryRef.current[currentChat],
                    message
                ];
                setForceUpdate(prev => prev + 1);
            }
        };

        // Обработчик события подключения
        const handleConnected = (connectedChatName) => {
            if (connectedChatName === currentChatNameRef.current) {
                setIsConnected(true);
                console.log(`Chat ${connectedChatName} connected`);
            }
        };

        // Подписываемся на события
        const unsubscribeNewMessage = window.runtime.EventsOn('message', handleNewMessage);
        const unsubscribeConnected = window.runtime.EventsOn('chat_connected', handleConnected);

        return () => {
            // Отписываемся от событий при размонтировании или смене чата
            unsubscribeNewMessage();
            unsubscribeConnected();
            setIsConnected(false);
        };
    }, [chatName]);

    const handleSendMessage = async () => {
        if (currentMessage.trim() === '') return;

        const userMessage = {
            body: currentMessage,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            chat: chatName
        };

        // Оптимистично добавляем сообщение в историю
        if (!chatsHistoryRef.current[chatName]) {
            chatsHistoryRef.current[chatName] = [];
        }

        chatsHistoryRef.current[chatName] = [
            ...chatsHistoryRef.current[chatName],
            userMessage
        ];
        setForceUpdate(prev => prev + 1);

        // Отправляем сообщение на сервер
        await SendMessage(chatName, currentMessage);
        setCurrentMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!chatName) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7f8c8d',
                fontSize: '18px'
            }}>
                Выберите чат из sidebar
            </div>
        );
    }

    return (
        <div id="Chat" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100%',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Шапка чата с индикатором подключения */}
            <div style={{
                padding: '15px 20px',
                borderBottom: '2px solid #ecf0f1',
                background: '#f8f9fa'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
                        {chatName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isLoading && (
                            <div style={{
                                fontSize: '12px',
                                color: '#f39c12',
                                fontWeight: 'bold'
                            }}>
                                📥 Загрузка...
                            </div>
                        )}
                        <div style={{
                            fontSize: '12px',
                            color: isConnected ? '#27ae60' : '#e74c3c',
                            fontWeight: 'bold'
                        }}>
                            {isConnected ? '✓ Online' : '⌛ Connecting...'}
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                    Сообщений: {chatHistory.length}
                </div>
            </div>

            {/* Область сообщений */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                background: '#fafafa'
            }}>
                {isLoading ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#bdc3c7',
                        padding: '40px',
                        fontStyle: 'italic'
                    }}>
                        Загрузка истории сообщений...
                    </div>
                ) : !isConnected ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#bdc3c7',
                        padding: '40px',
                        fontStyle: 'italic'
                    }}>
                        Подключаемся к чату...
                    </div>
                ) : chatHistory.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#bdc3c7',
                        padding: '40px',
                        fontStyle: 'italic'
                    }}>
                        Нет сообщений. Начните общение!
                    </div>
                ) : (
                    chatHistory.map((message, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '15px'
                            }}
                        >
                            <div style={{
                                maxWidth: '70%',
                                padding: '10px 15px',
                                borderRadius: '15px',
                                background: message.sender === 'user' ? '#3498db' : '#e0e0e0',
                                color: message.sender === 'user' ? 'white' : '#333',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '14px' }}>{message.body}</div>
                                <div style={{
                                    fontSize: '11px',
                                    opacity: 0.7,
                                    textAlign: message.sender === 'user' ? 'right' : 'left',
                                    marginTop: '5px'
                                }}>
                                    {message.timestamp}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Панель ввода сообщения */}
            <div style={{
                padding: '20px',
                borderTop: '2px solid #ecf0f1',
                background: '#f8f9fa'
            }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isConnected ? "Введите сообщение..." : "Подключаемся к чату..."}
                        disabled={!isConnected || isLoading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: `1px solid ${isConnected ? '#ddd' : '#eee'}`,
                            borderRadius: '8px',
                            resize: 'none',
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '14px',
                            minHeight: '50px',
                            maxHeight: '120px',
                            background: (isConnected && !isLoading) ? 'white' : '#fafafa',
                            color: (isConnected && !isLoading) ? '#333' : '#999'
                        }}
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || !isConnected || isLoading}
                        style={{
                            padding: '12px 24px',
                            background: (currentMessage.trim() && isConnected && !isLoading) ? '#3498db' : '#bdc3c7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (currentMessage.trim() && isConnected && !isLoading) ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            minWidth: '80px'
                        }}
                    >
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;