import {useState} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import LoginForm from "./assets/components/Login.jsx";
import Dashboard from "./assets/components/Dashboard.jsx";


function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    return <div id="App">
        {!loggedIn ? <LoginForm loggedIn={loggedIn} setLoggedIn={setLoggedIn}/> : <Dashboard/>}
    </div>

}

export default App
