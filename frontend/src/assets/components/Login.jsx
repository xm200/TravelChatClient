import {useState} from "react";
import {Login} from "../../../wailsjs/go/main/App.js";
import logo from "../images/logo-universal.png";

const LoginForm = ({ loggedIn, setLoggedIn }) => {
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    const updateName = (e) => setName(e.target.value);
    const updatePass = (e) => setPass(e.target.value)
    const updateResultText = (result) => setResultText(result);

    async function login() {
        setLoggedIn(false);
        const buf = await Login(name, pass);
        console.log(buf)
        if (buf === true) {
            setLoggedIn(true);
        }
    }

    return (
        <div id="LoginForm">
            <img src={logo} id="logo" alt="logo"/>
            <div id="result" className="result">{resultText}</div>
            <div id="input" className="input-box">
                <label id="name">Username</label>
                <input id="name" className="input" onChange={updateName} autoComplete="off" name="input" type="text"/>
                <label id="pass">Password</label>
                <input id="pass" className="input" onChange={updatePass} autoComplete="off" name="input" type="text"/>
                <button className="btn" onClick={login}>Greet</button>
                <p>{loggedIn}</p>
            </div>
        </div>
    )
}
export default LoginForm;