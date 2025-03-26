import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaHome, FaComments, FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaChevronDown, FaBars, FaChevronLeft
} from 'react-icons/fa';
import '../Sidebar.css';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
    useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth <= 767) {
            setIsCollapsed(true);
          }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // вызвать сразу при загрузке

        return () => window.removeEventListener('resize', handleResize);
      }, []);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([]);
  const navigate = useNavigate();

  const userId = localStorage.getItem('user_id');
  const { id: selectedChatId } = useParams();
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
  <>
    {isCollapsed && (
      <button onClick={() => setIsCollapsed(false)} className="sidebar-toggle-fixed">
        <FaBars />
      </button>
    )}

    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {!isCollapsed && (
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <Link to="/" className="logo-text">
              <span>Unlim Mind</span>
            </Link>
            <button onClick={() => setIsCollapsed(true)} className="sidebar-toggle">
              <FaChevronLeft />
            </button>
          </div>

          {/* Верхний блок с основными ссылками */}
          <div className="sidebar-section">
            <ul>
              <li><Link to="/support"><FaComments className="icon" /> <span>Поддержка</span></Link></li>
              <li><Link to="/profile"><FaUser className="icon" /> <span>Профиль</span></Link></li>
              <li><Link to="/documents"><FaFile className="icon" /> <span>Документы</span></Link></li>
              <li><Link to="/libraries"><FaBook className="icon" /> <span>Библиотеки</span></Link></li>
            </ul>
          </div>

          {/* Чаты */}
          <nav className="sidebar-nav">
            <ul>
              <li>
                <div onClick={() => {}} className="chat-link">
                  <FaHome className="icon" />
                  <span>Чаты</span>
                  <FaChevronDown />
                </div>
                <ul className="chat-list">
                  {chats.length === 0 && (
                    <li style={{ paddingLeft: '1em', opacity: 0.6 }}>Нет чатов</li>
                  )}
                  {Array.isArray(chats) && chats.map((chat: any) => {
                    const isActive = chat.id === parseInt(selectedChatId || '', 10);
                    return (
                      <li key={chat.id} className={isActive ? 'active' : ''}>
                        <Link to={`/chat/${chat.id}`}>{chat.title}</Link>
                      </li>
                    );
                  })}
                  <li>
                    <button onClick={createNewChat}>+ Новый чат</button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>

          {/* Низ — Подписка + Приветствие */}
          <div className="sidebar-footer">
            <div className="subscription-link">
              <Link to="/subscriptions">
                <FaCreditCard className="icon" />
                <span>Подписка</span>
              </Link>
            </div>

            <div className="user-greeting">
              {userName ? (
                <>
                  <FaUser className="icon" />
                  <span>Привет, {userName}</span>
                </>
              ) : (
                <Link to="/auth">
                  <FaSignInAlt className="icon" />
                  <span>Войти</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
};

export default Sidebar;
