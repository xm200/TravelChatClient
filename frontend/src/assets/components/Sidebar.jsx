import IcoChat from "./IcoChat.jsx";

const Sidebar = ({ chats, onChatSelect, activeChat }) => {
    return (
        <div style={{
            width: '280px',
            background: '#2c3e50',
            color: 'white',
            padding: '20px 0',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            height: '100vh',
            overflowY: 'auto'
        }}>
            <h3 style={{
                padding: '0 20px 20px 20px',
                margin: 0,
                borderBottom: '1px solid #34495e'
            }}>
                Чаты
            </h3>

            <div style={{ padding: '0 20px' }}>
                {chats.map(chatName => (
                    <IcoChat
                        key={chatName}
                        name={chatName}
                        isActive={activeChat === chatName}
                        onClick={() => onChatSelect(chatName)}
                    />
                ))}
            </div>
        </div>
    );
};
export default Sidebar;