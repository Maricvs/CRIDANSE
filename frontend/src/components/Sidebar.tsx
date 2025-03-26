import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHome, FaComments, FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaChevronDown
} from 'react-icons/fa';
import '../Sidebar.css';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([]);
  const navigate = useNavigate();

  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name');

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/chats/${userId}`)
      .then(res => res.json())
      .then(data => setChats(data))
      .catch(console.error);
  }, [userId]);

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
      .catch(console.error);
  };

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

      {/* Верхний блок с основными ссылками */}
      <div className="sidebar-section">
        <ul>
          <li><Link to="/support"><FaComments className="icon" /> {!isCollapsed && <span>Поддержка</span>}</Link></li>
          <li><Link to="/profile"><FaUser className="icon" /> {!isCollapsed && <span>Профиль</span>}</Link></li>
          <li><Link to="/documents"><FaFile className="icon" /> {!isCollapsed && <span>Документы</span>}</Link></li>
          <li><Link to="/libraries"><FaBook className="icon" /> {!isCollapsed && <span>Библиотеки</span>}</Link></li>
        </ul>
      </div>

      {/* Чаты */}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <div onClick={() => {}} className="chat-link">
              <FaHome className="icon" />
              {!isCollapsed && (
                <div className="chat-link-content">
                  <span>Чаты</span>
                  <FaChevronDown />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ul className="chat-list">
                {chats.length === 0 && (
                  <li style={{ paddingLeft: '1em', opacity: 0.6 }}>Нет чатов</li>
                )}
                {Array.isArray(chats) && chats.map((chat: any) => (
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
        </ul>
      </nav>

      {/* Низ — Подписка + Приветствие */}
      <div className="sidebar-footer">
        <div className="subscription-link">
          <Link to="/subscriptions">
            <FaCreditCard className="icon" />
            {!isCollapsed && <span>Подписка</span>}
          </Link>
        </div>

        <div className="user-greeting">
          {userName ? (
            <>
              <FaUser className="icon" />
              {!isCollapsed && <span>Привет, {userName}</span>}
            </>
          ) : (
            <Link to="/auth">
              <FaSignInAlt className="icon" />
              {!isCollapsed && <span>Войти</span>}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
