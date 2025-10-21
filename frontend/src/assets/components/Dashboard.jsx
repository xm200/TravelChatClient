import {useEffect, useState} from "react";
import {GetMemberships} from '../../../wailsjs/go/main/App.js'
import IcoChat from "./Chat.jsx";

const Dashboard = () => {
    const [chats, setChats] = useState([]);
    const [selected, selectChat] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadChats()
    }, []);

    // Основной компонент Sidebar
    const Sidebar = ({children}) => {
        const elems = children.map(item => (
            <IcoChat name={item} key={item}/>
        ))
      return (
          <div style={{
            display: 'flex',
            height: '100vh',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden' // Убираем скролл у основного контейнера
        }}>
            {/* Sidebar с независимым скроллом */}
            <div className="sidebar" style={{
                width: '280px',
                background: '#2c3e50',
                color: 'white',
                padding: '20px 0',
                boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                overflowY: 'auto', // Включаем скролл только для sidebar
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h3 style={{
                    padding: '0 20px 20px 20px',
                    margin: 0,
                    borderBottom: '1px solid #34495e',
                    flexShrink: 0 // Заголовок не сжимается
                }}>
                    Меню
                </h3>
                <div style={{
                    padding: '0 20px',
                    flex: 1, // Занимает всё доступное пространство
                    overflowY: 'auto' // Скролл для списка элементов
                }}>
                    {elems}
                </div>
            </div>
          </div>
      );
    };

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

    return <div id="Dashboard" style={{
            display: 'flex', // Добавляем flex
            height: '100vh', // Занимаем всю высоту экрана
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden'
        }}>
            <Sidebar children={chats}/>
            <div style={{
                flex: 1,
                padding: '30px',
                background: '#ecf0f1',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h1 style={{color: '#2c3e50'}}>Основной контент</h1>

                {/* Демонстрационный контент чтобы увидеть скролл */}
                <div style={{flex: 1}}>
                    {Array.from({length: 50}, (_, i) => (
                        <p key={i} style={{
                            padding: '10px',
                            background: i % 2 === 0 ? '#fff' : '#f8f9fa',
                            margin: '5px 0',
                            borderRadius: '4px'
                        }}>
                            Пункт контента #{i + 1} - прокручивайте независимо от sidebar
                        </p>
                    ))}
                </div>
            </div>
        </div>
}

export default Dashboard;