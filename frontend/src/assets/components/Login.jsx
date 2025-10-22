import {useEffect, useState} from "react";
import {Login, Logout} from "../../../wailsjs/go/main/App.js";

const LoginForm = ({ loggedIn, setLoggedIn }) => {
    const [resultText, setResultText] = useState("Необходимо авторизоваться");
    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    const updateName = (e) => setName(e.target.value);
    const updatePass = (e) => setPass(e.target.value)
    const updateResultText = (result) => setResultText(result);

    useEffect(() => {
        console.log(loggedIn)
    }, [])

    async function login() {
        setLoggedIn(false);
        setResultText("Ожидается ответ от сервера");
        const buf = await Login(name, pass);
        console.log(buf)
        if (buf === true) {
            setLoggedIn(true);
            setResultText("Успешно! Проходите");
        } else {
            setResultText("Неверные данные")
        }
    }

    return (
        <div id="LoginForm">
            <div id="input" className="input-box" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div id="inputVal">
                    <label id="name">Ваше имя</label>
                    <br/>
                    <input id="name" className="input" onChange={updateName} autoComplete="off" name="input" type="text"/>
                </div>
                <div id="inputVal">
                    <label id="pass">Пароль</label>
                    <br/>
                    <input id="pass" className="input" onChange={updatePass} autoComplete="off" name="input" type="text"/>
                </div>
                <button className="btn" onClick={login}>Войти</button>
            </div>
            <div id="result" className="result">{resultText}</div>
        </div>
    )
}
export default LoginForm;