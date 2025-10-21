const IcoChat = ({ name, isActive, onClick }) => {
    return (
        <div
            className="sidebar-item"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 15px',
                margin: '5px 0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: isActive ? '#3498db' : 'transparent',
                border: isActive ? '1px solid #2980b9' : '1px solid transparent'
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.target.style.background = '#34495e';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.target.style.background = 'transparent';
                }
            }}
        >
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isActive ? 'white' : '#3498db',
                marginRight: '10px'
            }}></div>
            <p style={{
                margin: 0,
                fontWeight: isActive ? 'bold' : 'normal'
            }}>
                {name}
            </p>
        </div>
    );
};

export default IcoChat