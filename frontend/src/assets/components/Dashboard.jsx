import React, {useEffect, useState} from "react";
import {GetMemberships, Logout} from '../../../wailsjs/go/main/App.js'
import Sidebar from "./Sidebar.jsx";
import Chat from "./Chat.jsx";

const Dashboard = ( {loggedIn, setLoggedIn} ) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadChats()
        console.log(loggedIn, setLoggedIn)
    }, []);


    const loadChats = async () => {
        try {
            setLoading(true);
            const buf = await GetMemberships();
            setChats(buf || []);

            console.log(buf, "Loading chats");
        } catch (e) {
            console.log("Error while loading chats: ", e)
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="Dashboard">Chats are loading</div>
    }

    return (
        <div id="Dashboard" style={{
            display: 'flex',
            height: '100vh',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden'
        }}>
            {/* Sidebar с передачей функции setActiveChat */}
            <div style={{
                width: '280px',
                flexShrink: 0
            }}>
                <Sidebar
                    chats={chats}
                    onChatSelect={setActiveChat}
                    activeChat={activeChat}
                />
            </div>
            {/* Основной контент */}
            <Chat chatName={activeChat} loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>
        </div>
    );
}

export default Dashboard;