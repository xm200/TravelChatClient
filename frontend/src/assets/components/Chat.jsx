import {useState} from "react";
import {ConnectChat} from "../../../wailsjs/go/main/App.js";

const IcoChat = ({name}) => {
    return (
        <div className="sidebar-item" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 15px',
            margin: '5px 0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'transparent'
        }}
        onMouseEnter={(e) => {
            e.target.style.background = '#34495e';
        }}
        onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#3498db',
                marginRight: '10px'
            }}></div>
            <p style={{ margin: 0 }}>{name}</p>
        </div>
    );
}

const DisplayChat = ({name}) => {
    return <div className="testDisp">
        <p>I AM A TEST</p>
    </div>
}

const Chat = ({name}) => {
    const [messages, setLastMessage] =  useState('');

    const updateMessages = async () => {
        const ws = await ConnectChat(name)
    }

    return <div className="Chat">
      <p>{name}</p>
    </div>
}

export default IcoChat