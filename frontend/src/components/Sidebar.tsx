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
  const [isChatListVisible, setIsChatListVisible] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleChatList = () => {
    setIsChatListVisible(!isChatListVisible);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <Link to="/">
          {!isCollapsed && <span>Unlim Mind AI 2</span>}
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
                  <span>Чат</span>
                  {isChatListVisible ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              )}
            </div>
            {!isCollapsed && isChatListVisible && (
              <ul className="chat-list">
                <li>Чат 1</li>
                <li>Чат 2</li>
                <li>Чат 3</li>
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
              {!isCollapsed && <span>Подписьки</span>}
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
