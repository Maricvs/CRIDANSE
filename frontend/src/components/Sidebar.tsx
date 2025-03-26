import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHome, FaComments, FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import '../Sidebar.css';

const Sidebar: React.FC = () => {
  // Состояние: свернута ли панель
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Состояние: показывать ли список чатов
//  const [isChatListVisible, setIsChatListVisible] = useState(true);

  // Список чатов, загружается с сервера
  //const [chats, setChats] = useState([]);
  const [chats, setChats] = useState([
  { id: 999, title: "Тестовый чат (локальный)" }
  ]);

  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');      // ID пользователя
  const userName = localStorage.getItem('user_name');  // Имя пользователя

  // Загрузка чатов при монтировании компонента
  useEffect(() => {
    if (!userId) {
      console.warn("⚠️ user_id не найден в localStorage");
      return;
    }

    console.log("📡 Загружаем чаты для user_id =", userId);

    fetch(`/api/chats/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("📥 Получены чаты:", data);
        setChats(data);
      })
      .catch(err => console.error('❌ Ошибка при загрузке чатов:', err));
  }, [userId]);

  // Создание нового чата
  const createNewChat = () => {
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId || '0'),
        title: `Чат ${chats.length + 1}`,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setChats([...chats, data]);
        navigate(`/chat/${data.id}`);
      })
      .catch(err => console.error('❌ Ошибка при создании чата:', err));
  };

  // JSX компонента
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <Link to="/">
          {!isCollapsed && <span>Unlim Mind</span>}
        </Link>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle">
          {isCollapsed ? '>' : '<'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            {/* Кнопка "Чаты" */}
            <div onClick={() => {}} className="chat-link">
              <FaHome className="icon" />
              {!isCollapsed && (
                <div className="chat-link-content">
                  <span>Чаты</span>
                  {isChatListVisible ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              )}
            </div>

            {/* Выпадающий список чатов */}
            {!isCollapsed && isChatListVisible && (
              <ul className="chat-list">
                {chats.length === 0 && (
                  <li style={{ paddingLeft: '1em', opacity: 0.6 }}>Нет чатов</li>
                )}
                {Array.isArray(chats) && chats.map((chat) => (
                  <li key={chat.id}>
                    <Link to={`/chat/${chat.id}`}>{chat.title}</Link>
                  </li>
                ))}
                <li>
                  <button onClick={createNewChat}>+ Новый чат</button>
                </li>
              </ul>
            )}
          </li>

          {/* Остальные пункты меню */}
          <li><Link to="/support"><FaComments className="icon" /> {!isCollapsed && <span>Поддержка</span>}</Link></li>
          <li><Link to="/subscriptions"><FaCreditCard className="icon" /> {!isCollapsed && <span>Подписки</span>}</Link></li>
          <li><Link to="/profile"><FaUser className="icon" /> {!isCollapsed && <span>Профиль</span>}</Link></li>
          <li><Link to="/documents"><FaFile className="icon" /> {!isCollapsed && <span>Документы</span>}</Link></li>
          <li><Link to="/libraries"><FaBook className="icon" /> {!isCollapsed && <span>Библиотеки</span>}</Link></li>
        </ul>
      </nav>

      {/* Подвал с именем пользователя */}
      <div className="sidebar-footer">
        {userName ? (
          <div className="user-greeting">
            <FaUser className="icon" />
            {!isCollapsed && <span>Привет, {userName}</span>}
          </div>
        ) : (
          <Link to="/auth">
            <FaSignInAlt className="icon" />
            {!isCollapsed && <span>Войти</span>}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
