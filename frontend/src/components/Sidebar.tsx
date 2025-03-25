import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaComments,
  FaCreditCard,
  FaUser,
  FaFile,
  FaBook,
  FaSignInAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import '../Sidebar.css';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatListVisible, setIsChatListVisible] = useState(true); // Исправлено, только одно объявление!

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleChatList = () => {
    setIsChatListVisible(!isChatListVisible);
  };

  const [chats, setChats] = useState([
    { id: 1, title: 'Новый чат' },
  ]);

  return (
    <div
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{ backgroundColor: 'red' }}
    >
      <div className="sidebar-logo">
        <Link to="/">
          {!isCollapsed && <span>Unlim Mind q</span>}
        </Link>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {isCollapsed ? '>' : '<'}
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <div onClick={toggleChatList} className="chat-link">
              <FaHome className="icon" />
              {!isCollapsed && (
                <div className="chat-link-content">
                  <span>Чаты</span>
                  {isChatListVisible ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              )}
            </div>

            {!isCollapsed && isChatListVisible && (
              <ul className="chat-list">
                {chats.map((chat) => (
                  <li key={chat.id}>
                    <Link to={`/chat/${chat.id}`}>{chat.title}</Link>
                  </li>
                ))}
                <li>
                  <button onClick={() => {
                    const newId = Date.now();
                    setChats([...chats, { id: newId, title: `Чат ${chats.length + 1}` }]);
                  }}>
                    + Новый чат
                  </button>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link to="/support">
              <FaComments className="icon" />
              {!isCollapsed && <span>Поддержка</span>}
            </Link>
          </li>
          <li>
            <Link to="/subscriptions">
              <FaCreditCard className="icon" />
              {!isCollapsed && <span>Подписки</span>}
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <FaUser className="icon" />
              {!isCollapsed && <span>Профиль</span>}
            </Link>
          </li>
          <li>
            <Link to="/documents">
              <FaFile className="icon" />
              {!isCollapsed && <span>Документы</span>}
            </Link>
          </li>
          <li>
            <Link to="/libraries">
              <FaBook className="icon" />
              {!isCollapsed && <span>Библиотеки</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <Link to="/auth">
          <FaSignInAlt className="icon" />
          {!isCollapsed && <span>Войти</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
