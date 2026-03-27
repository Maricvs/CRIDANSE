import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaBars, FaChevronLeft,
  FaSignOutAlt, FaPlus, FaComment, FaTrash, FaEdit,
  FaGlobe, FaQuestionCircle
} from 'react-icons/fa';
import '../Sidebar.css';
import { useChat } from '../context/ChatContext';

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_time?: string;
  isTemporary?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [isRenamingInProgress, setIsRenamingInProgress] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const [localUserId, setLocalUserId] = useState(localStorage.getItem('user_id'));
  const { id: selectedChatId } = useParams();
  const userName = localStorage.getItem('user_name');
  const { createChat } = useChat();

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

  useEffect(() => {
    const handleAuthChange = () => {
      setLocalUserId(localStorage.getItem('user_id'));
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed migrateTemporaryChats

  const sortChats = (chats: Chat[]) => {
    return [...chats].sort((a, b) => {
      const aTime = a.last_message_time || a.updated_at;
      const bTime = b.last_message_time || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  };

  const fetchChats = async () => {
    if (!localUserId) return;
    try {
      const response = await fetch(`/api/chats/user/${localUserId}`, {
        headers: { 'X-Authorization': `Bearer ${localStorage.getItem('user_token')}` }
      });
      if (!response.ok) throw new Error('Error loading chats');
      const data = await response.json();
      setChats(sortChats(data));
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [localUserId]);

  useEffect(() => {
    const handleMessageSent = () => {
      fetchChats();
    };

    window.addEventListener('messageSent', handleMessageSent);
    return () => window.removeEventListener('messageSent', handleMessageSent);
  }, [localUserId]);

  useEffect(() => {
    const handleChatTitleUpdated = (e: any) => {
      const { chatId, newTitle } = e.detail;
      setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, title: newTitle } : chat));
    };
    window.addEventListener('chatTitleUpdated', handleChatTitleUpdated);
    return () => window.removeEventListener('chatTitleUpdated', handleChatTitleUpdated);
  }, []);

  const handleNewChat = async () => {
    try {
      const user_id = localUserId ? parseInt(localUserId) : undefined;
      const newChat = await createChat({ user_id, title: 'New Chat' });
      setChats(prev => [newChat, ...prev]);
      setIsCollapsed(false);
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      alert('Failed to create chat. Please try again later.');
    }
  };

  const deleteChat = async (chatId: number) => {
    if (!window.confirm('Delete this chat?')) return;
    
    try {
      if (localUserId) {
        const response = await fetch(`/api/chats/delete/${chatId}`, { 
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
          }
        });
        
        if (!response.ok) throw new Error('Error deleting chat');
        
        setChats(prev => prev.filter((c: Chat) => c.id !== chatId));
      }
      
      setContextMenu(null);
      
      if (parseInt(selectedChatId || '') === chatId) {
        navigate('/');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('Failed to delete chat. Please try again later.');
    }
  };

  const renameChat = async (chatId: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      if (localUserId) {
        const response = await fetch(`/api/chat/title/${chatId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
          },
          body: JSON.stringify({ title: newTitle.trim() }),
        });
        
        if (!response.ok) {
          throw new Error('Error renaming chat');
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
      }
    } catch (err) {
      console.error('Error renaming chat:', err);
      alert('Failed to rename chat. Please try again later.');
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
      console.error('Error renaming:', err);
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
    if (window.innerWidth <= 767) {
      setIsCollapsed(true);
    }
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    setChats([]);
    navigate('/auth');
  };

  const toggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  const handleMenuItemClick = () => {
    setShowUserMenu(false);
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
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
                  <li><Link to="/mylibrary" onClick={handleLinkClick}><FaFile className="icon" /> <span>My Library</span></Link></li>
                  <li><Link to="/documents" onClick={handleLinkClick}><FaFile className="icon" /> <span>Documents</span></Link></li>
                  <li><Link to="/libraries" onClick={handleLinkClick}><FaBook className="icon" /> <span>Libraries</span></Link></li>                  
                </ul>
              </div>

              <nav className="sidebar-nav">
                <ul>
                  <li>
                    <button className="new-chat-button" onClick={handleNewChat}>
                      <FaPlus className="icon" /> New chat
                    </button>
                    <div className="chat-link">
                      <FaComment className="icon" />
                      <span>Chats</span>
                    </div>

                    <div className="chat-scrollable">
                      <ul className="chat-list">
                        {chats.length === 0 && (
                          <li className="no-chats">No chats</li>
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
                                  className={selectedChatId === String(chat.id) ? 'active-chat' : ''}
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
                  <Link to="/subscriptions" onClick={handleLinkClick}><FaCreditCard className="icon" /><span>Subscription</span></Link>
                </div>
                <div className="user-greeting" ref={userMenuRef}>
                  {userName ? (
                    <>
                      <div className="flex-container" onClick={toggleUserMenu} style={{ cursor: 'pointer' }}>
                        <FaUser className="icon" /><span>{userName}</span>
                      </div>
                      <div className={`user-menu ${showUserMenu ? 'active' : ''}`}>
                        <div className="user-menu-item" onClick={handleMenuItemClick}>
                          <FaQuestionCircle className="icon" />
                          <span>Support</span>
                        </div>
                        <div className="user-menu-item" onClick={handleMenuItemClick}>
                          <FaGlobe className="icon" />
                          <span>Language</span>
                        </div>
                        <div className="user-menu-item" onClick={() => {
                          handleMenuItemClick();
                          handleLogout();
                        }}>
                          <FaSignOutAlt className="icon" />
                          <span>Logout</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link to="/auth" onClick={handleLinkClick} className="flex-container">
                      <FaSignInAlt className="icon" />
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Removed migration prompt html */}
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
            <FaEdit /> Rename
          </div>
          <div className="context-menu-item" onClick={() => deleteChat(contextMenu.chatId)}>
            <FaTrash /> Delete
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
