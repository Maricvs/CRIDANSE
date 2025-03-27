import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaHome, FaComments, FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaChevronDown, FaBars, FaChevronLeft
} from 'react-icons/fa';
import '../Sidebar.css';
import { FaTrash, FaEdit } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([]);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);

  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const { id: selectedChatId } = useParams();
  const userName = localStorage.getItem('user_name');

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const deleteChat = async (chatId: number) => {
    if (!window.confirm('Удалить этот чат?')) return;
    const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
    if (res.ok) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (parseInt(selectedChatId || '') === chatId) navigate('/');
    }
  };

  const renameChat = async (chatId: number, title: string) => {
    const res = await fetch(`/api/chat/title/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) alert("Не удалось переименовать чат");
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleRename = (chatId: number) => {
    setEditingChatId(chatId);
    setContextMenu(null);
  };

  const handleBlur = (chatId: number, newTitle: string) => {
    renameChat(chatId, newTitle);
    setEditingChatId(null);
  };

  return (
    <>
      {isCollapsed && (
        <button onClick={() => setIsCollapsed(false)} className="sidebar-toggle-fixed">
          <FaBars />
        </button>
      )}

      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-content">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <Link to="/" className="logo-text">
                  <span>Unlim Mind</span>
                </Link>
                <button onClick={() => setIsCollapsed(true)} className="sidebar-toggle">
                  <FaChevronLeft />
                </button>
              </div>

              <div className="sidebar-section">
                <ul>
                  <li><Link to="/support"><FaComments className="icon" /> <span>Поддержка</span></Link></li>
                  <li><Link to="/profile"><FaUser className="icon" /> <span>Профиль</span></Link></li>
                  <li><Link to="/documents"><FaFile className="icon" /> <span>Документы</span></Link></li>
                  <li><Link to="/libraries"><FaBook className="icon" /> <span>Библиотеки</span></Link></li>
                </ul>
              </div>

              <nav className="sidebar-nav">
                <ul>
                  <li>
                    <div className="chat-link">
                      <FaHome className="icon" />
                      <span>Чаты</span>
                      <FaChevronDown />
                    </div>
                    <ul className="chat-list">
                      {chats.length === 0 && (
                        <li style={{ paddingLeft: '1em', opacity: 0.6 }}>Нет чатов</li>
                      )}
                      {chats.map(chat => {
                        const isActive = chat.id === parseInt(selectedChatId || '', 10);
                        return (
                          <li key={chat.id} className={isActive ? 'active' : ''} onContextMenu={(e) => handleContextMenu(e, chat.id)}>
                            {editingChatId === chat.id ? (
                              <input
                                autoFocus
                                defaultValue={chat.title}
                                onBlur={(e) => handleBlur(chat.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                              />
                            ) : (
                              <Link to={`/chat/${chat.id}`}>{chat.title}</Link>
                            )}
                          </li>
                        );
                      })}
                      <li><button onClick={createNewChat}>+ Новый чат</button></li>
                    </ul>
                  </li>
                </ul>
              </nav>

              <div className="sidebar-footer">
                <div className="subscription-link">
                  <Link to="/subscriptions"><FaCreditCard className="icon" /><span>Подписка</span></Link>
                </div>
                <div className="user-greeting">
                  {userName ? (
                    <>
                      <FaUser className="icon" /><span>Привет, {userName}</span>
                    </>
                  ) : (
                    <Link to="/auth"><FaSignInAlt className="icon" /><span>Войти</span></Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="context-menu-item" onClick={() => handleRename(contextMenu.chatId)}>
            <FaEdit /> Переименовать
          </div>
          <div className="context-menu-item" onClick={() => deleteChat(contextMenu.chatId)}>
            <FaTrash /> Удалить
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
