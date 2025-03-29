import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaComments, FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaBars, FaChevronLeft,
  FaSignOutAlt, FaPlus, FaComment, FaTrash, FaEdit
} from 'react-icons/fa';
import '../Sidebar.css';

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_time?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [isRenamingInProgress, setIsRenamingInProgress] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const { id: selectedChatId } = useParams();
  const userName = localStorage.getItem('user_name');

  useEffect(() => {
    const handleResize = () => {
      const shouldCollapse = window.innerWidth <= 767;
      setIsCollapsed(shouldCollapse);
      onCollapse?.(shouldCollapse);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth <= 767 && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) && 
          !isCollapsed) {
        setIsCollapsed(true);
        onCollapse?.(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCollapsed, onCollapse]);

  const sortChats = (chats: Chat[]) => {
    return [...chats].sort((a, b) => {
      const aTime = a.last_message_time || a.updated_at;
      const bTime = b.last_message_time || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  };

  const fetchChats = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/chats/${userId}`);
      if (!response.ok) throw new Error('Ошибка при загрузке чатов');
      const data = await response.json();
      setChats(sortChats(data));
    } catch (err) {
      console.error('Ошибка при загрузке чатов:', err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [userId]);

  useEffect(() => {
    const handleMessageSent = () => {
      fetchChats();
    };

    window.addEventListener('messageSent', handleMessageSent);
    return () => window.removeEventListener('messageSent', handleMessageSent);
  }, [userId]);

  const handleNewChat = () => {
    createNewChat();
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId || '0'),
          title: `Новый чат`,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при создании чата');
      }

      const newChat = await response.json();
      setChats(prev => [newChat, ...prev]);
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Ошибка при создании чата:', err);
      alert('Не удалось создать чат. Пожалуйста, попробуйте позже.');
    }
  };

  const deleteChat = async (chatId: number) => {
    if (!window.confirm('Удалить этот чат?')) return;
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении чата');
      }
      
      setChats(prev => prev.filter(c => c.id !== chatId));
      setContextMenu(null);
      
      if (parseInt(selectedChatId || '') === chatId) {
        navigate('/');
      }
    } catch (err) {
      console.error('Ошибка при удалении чата:', err);
      alert('Не удалось удалить чат. Пожалуйста, попробуйте позже.');
    }
  };

  const renameChat = async (chatId: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/chat/title/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при переименовании чата');
      }
      
      const updatedChat = await response.json();
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === chatId ? { 
            ...chat, 
            title: updatedChat.title, 
            updated_at: new Date().toISOString()
          } : chat
        );
        return sortChats(updatedChats);
      });
      
    } catch (err) {
      console.error('Ошибка при переименовании чата:', err);
      alert('Не удалось переименовать чат. Пожалуйста, попробуйте позже.');
    } finally {
      setIsRenamingInProgress(false);
      setEditingChatId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleRename = (chatId: number) => {
    setEditingChatId(chatId);
    setContextMenu(null);
  };

  const handleBlur = async (chatId: number, newTitle: string) => {
    if (newTitle.trim() === '') return;
    
    setIsRenamingInProgress(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await renameChat(chatId, newTitle);
    } catch (err) {
      console.error('Ошибка при переименовании:', err);
    } finally {
      setIsRenamingInProgress(false);
      setEditingChatId(null);
    }
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 767) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    setChats([]);
    navigate('/auth');
  };

  const toggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  return (
    <>
      {isCollapsed && (
        <button onClick={() => toggleCollapse(false)} className="sidebar-toggle-fixed">
          <FaBars />
        </button>
      )}

      <div ref={sidebarRef} className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-content">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <Link to="/" className="logo-text" onClick={handleLinkClick}>
                  <span>CRIDANSE</span>
                </Link>
                <button onClick={() => toggleCollapse(true)} className="sidebar-toggle">
                  <FaChevronLeft />
                </button>
              </div>

              <div className="sidebar-section">
                <ul>
                  <li><Link to="/support" onClick={handleLinkClick}><FaComments className="icon" /> <span>Поддержка</span></Link></li>
                  <li><Link to="/documents" onClick={handleLinkClick}><FaFile className="icon" /> <span>Документы</span></Link></li>
                  <li><Link to="/libraries" onClick={handleLinkClick}><FaBook className="icon" /> <span>Библиотеки</span></Link></li>
                </ul>
              </div>

              <nav className="sidebar-nav">
                <ul>
                  <li>
                    <button className="new-chat-button" onClick={handleNewChat}>
                      <FaPlus className="icon" /> Новый чат
                    </button>
                    <div className="chat-link">
                      <FaComment className="icon" />
                      <span>Чаты</span>
                    </div>

                    <div className="chat-scrollable">
                      <ul className="chat-list">
                        {chats.length === 0 && (
                          <li className="no-chats">Нет чатов</li>
                        )}
                        {chats.map(chat => {
                          const isActive = chat.id === parseInt(selectedChatId || '', 10);
                          return (
                            <li 
                              key={chat.id} 
                              className={`${isActive ? 'active' : ''} ${isRenamingInProgress && editingChatId === chat.id ? 'renaming' : ''}`}
                              onContextMenu={(e) => handleContextMenu(e, chat.id)}
                            >
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
                                <Link 
                                  to={`/chat/${chat.id}`} 
                                  onClick={handleLinkClick}
                                  className={isActive ? 'active-chat' : ''}
                                >
                                  {chat.title}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </li>
                </ul>
              </nav>

              <div className="sidebar-footer">
                <div className="subscription-link">
                  <Link to="/subscriptions" onClick={handleLinkClick}><FaCreditCard className="icon" /><span>Подписка</span></Link>
                </div>
                <div className="user-greeting">
                  {userName ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaUser className="icon" /><span>Привет, {userName}</span>
                      </div>
                      <button className="logout-button" onClick={handleLogout}>
                        <FaSignOutAlt /> Выйти
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={handleLinkClick}><FaSignInAlt className="icon" /><span>Войти</span></Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
