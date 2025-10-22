import React, {useEffect, useState, useRef} from 'react';
import {SendMessage, Connect, GetHistory, DecodeName, Logout} from "../../../wailsjs/go/main/App.js";

const Chat = ({ chatName, loggedIn, setLoggedIn }) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUser, setCurrentUser] = useState('');
    const [forceUpdate, setForceUpdate] = useState(0);

    // Отдельные состояния для каждого чата
    const [chatStates, setChatStates] = useState({});

    // useRef для хранения историй всех чатов
    const chatsHistoryRef = useRef({});

    // useRef для хранения состояний подключения
    const chatConnectionsRef = useRef({});

    // Получаем состояние текущего чата
    const currentChatState = chatName ? chatStates[chatName] : null;
    const isConnected = currentChatState?.isConnected || false;
    const isLoading = currentChatState?.isLoading || false;

    // Получаем историю для текущего чата
    const chatHistory = chatName ? chatsHistoryRef.current[chatName] || [] : [];

    // Функция для обновления состояния конкретного чата
    const updateChatState = (chatName, updates) => {
        setChatStates(prev => ({
            ...prev,
            [chatName]: {
                ...prev[chatName],
                ...updates
            }
        }));
    };

    // Функция для загрузки истории
    const loadChatHistory = async (chatNameToLoad) => {
        if (!chatNameToLoad) return;

        updateChatState(chatNameToLoad, { isLoading: true });
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
            updateChatState(chatNameToLoad, { isLoading: false });
        }
    };

    const changeCurrentUser = async () => {
        const buf = await DecodeName();
        if (!buf.includes("Error")) {
            console.log("Setting current user to " + buf);
            setCurrentUser(buf);
        }
    }

    useEffect(() => {
        changeCurrentUser()
    }, [])

    // Инициализация чата при первом выборе
    useEffect(() => {
        if (!chatName) return;

        // Если чат еще не инициализирован
        if (!chatStates[chatName]) {
            updateChatState(chatName, {
                isConnected: false,
                isLoading: false
            });

            // Загружаем историю и подключаемся
            const initializeChat = async () => {
                await loadChatHistory(chatName);
                Connect(chatName);
            };

            initializeChat();
        }
    }, [chatName]);

    // Глобальная подписка на события (один раз при монтировании)
    useEffect(() => {
        // Обработчик входящих сообщений для всех чатов
        const handleNewMessage = (message) => {
            console.log("New Message", message);

            if (message.chat && chatsHistoryRef.current[message.chat]) {
                chatsHistoryRef.current[message.chat] = [
                    ...chatsHistoryRef.current[message.chat],
                    message
                ];

                // Обновляем forceUpdate для ре-рендера
                setForceUpdate(prev => prev + 1);
            }
        };

        // Обработчик события подключения для всех чатов
        const handleConnected = (connectedChatName) => {
            console.log(`Chat ${connectedChatName} connected`);
            updateChatState(connectedChatName, { isConnected: true });
        };

        // Обработчик события отключения для всех чатов
        const handleDisconnected = (disconnectedChatName) => {
            console.log(`Chat ${disconnectedChatName} disconnected`);
            updateChatState(disconnectedChatName, { isConnected: false });
        };

        // Подписываемся на события один раз
        const unsubscribeNewMessage = window.runtime.EventsOn('message', handleNewMessage);
        const unsubscribeConnected = window.runtime.EventsOn('chat_connected', handleConnected);
        const unsubscribeDisconnected = window.runtime.EventsOn('chat_disconnected', handleDisconnected);

        return () => {
            // Отписываемся только при полном размонтировании компонента
            unsubscribeNewMessage();
            unsubscribeConnected();
            unsubscribeDisconnected();
        };
    }, []); // Пустой массив зависимостей - подписка один раз

    const handleSendMessage = async () => {
        if (currentMessage.trim() === '' || !isConnected) return;

        const userMessage = {
            body: currentMessage,
            sender: currentUser,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            destination: chatName
        };
        console.log("Current user is ", currentUser, " Current chat is ", chatName)

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

    const handleLogout = async () => {
        try {
            await Logout()
            setLoggedIn(false);
        } catch (e) {
            console.log("Failed to logout with ", e)
        }
    }

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
                <button onClick={handleLogout}>Выйти</button>
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
            <button onClick={handleLogout}>Выйти</button>
            {/* Шапка чата с индикатором подключения */}
            <div style={{
                padding: '15px 20px',
                borderBottom: '2px solid #ecf0f1',
                background: '#f8f9fa'
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2 style={{margin: 0, color: '#2c3e50', fontSize: '20px'}}>
                        {chatName}
                    </h2>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
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
                            key={`${chatName}-${index}`}
                            style={{
                                display: 'flex',
                                justifyContent: message.sender === currentUser ? 'flex-end' : 'flex-start',
                                marginBottom: '15px'
                            }}
                        >
                            <div style={{
                                maxWidth: '70%',
                                padding: '10px 15px',
                                borderRadius: '15px',
                                background: message.sender === currentUser ? '#3498db' : '#e0e0e0',
                                color: message.sender === currentUser ? 'white' : '#333',
                                position: 'relative'
                            }}>
                                <div style={{fontSize: '14px'}}>{message.body}</div>
                                <div style={{
                                    fontSize: '11px',
                                    opacity: 0.7,
                                    textAlign: message.sender === currentUser ? 'right' : 'left',
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
                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
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