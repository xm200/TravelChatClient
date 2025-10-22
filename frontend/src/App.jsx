import {useState, useEffect} from 'react';
import './App.css';
import LoginForm from "./assets/components/Login.jsx";
import Dashboard from "./assets/components/Dashboard.jsx";
import {ToggleFullscreen} from "../wailsjs/go/main/App.js";


function App() {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const handleKeyPress = (event) => {
            // F11 для полноэкранного режима
            if (event.key === 'F11') {
                event.preventDefault();
                ToggleFullscreen();
            }
            // Ctrl+Enter как альтернатива
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                ToggleFullscreen();
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await Logout();
            // Состояние обновится через событие, но на всякий случай:
            setLoggedIn(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Подписка на события авторизации
    useEffect(() => {
        const unsubscribeLogout = window.runtime.EventsOn('logout_completed', () => {
            setLoggedIn(false);
        });

        const unsubscribeLogin = window.runtime.EventsOn('login_success', () => {
            setLoggedIn(true);
        });

        return () => {
            unsubscribeLogout();
            unsubscribeLogin();
        };
    }, []);

    return <div id="App">
        {!loggedIn ? <LoginForm loggedIn={loggedIn} setLoggedIn={setLoggedIn}/> : <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>}
    </div>

}

export default App
