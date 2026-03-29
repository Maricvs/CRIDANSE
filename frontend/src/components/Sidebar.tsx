import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaCreditCard, FaUser, FaFile,
  FaBook, FaSignInAlt, FaBars, FaChevronLeft,
  FaSignOutAlt, FaPlus, FaComment, FaTrash, FaEdit,
  FaGlobe, FaQuestionCircle, FaFolder
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
  folder_id?: number | null;
}

interface Folder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [isRenamingInProgress, setIsRenamingInProgress] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);
  const [contextMenuView, setContextMenuView] = useState<'main' | 'folders'>('main');
  const [isMovingChat, setIsMovingChat] = useState(false);
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

  const fetchFolders = async () => {
    if (!localUserId) return;
    try {
      const response = await fetch(`/api/chats/folders`, {
        headers: { 'X-Authorization': `Bearer ${localStorage.getItem('user_token')}` }
      });
      if (!response.ok) throw new Error('Error loading folders');
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchFolders();
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

  const handleNewFolderClick = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const cancelNewFolder = () => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const submitNewFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !localUserId) return;
    setIsSavingFolder(true);
    try {
      const response = await fetch('/api/chats/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to create folder');
      await fetchFolders();
      setIsCreatingFolder(false);
      setNewFolderName('');
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('Failed to create folder.');
    } finally {
      setIsSavingFolder(false);
    }
  };

  const moveChatToFolder = async (chatId: number, folderId: number) => {
    if (!localUserId) return;
    setIsMovingChat(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/folder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify({ folder_id: folderId })
      });
      if (!response.ok) throw new Error('Failed to move chat');
      setChats(prev => prev.map(c => (c.id === chatId ? { ...c, folder_id: folderId } : c)));
      setContextMenu(null);
      setContextMenuView('main');
    } catch (err) {
      console.error('Error moving chat:', err);
      alert('Failed to move chat.');
    } finally {
      setIsMovingChat(false);
    }
  };

  const removeChatFromFolder = async (chatId: number) => {
    if (!localUserId) return;
    setIsMovingChat(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/folder`, {
        method: 'DELETE',
        headers: {
          'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to remove from folder');
      setChats(prev => prev.map(c => (c.id === chatId ? { ...c, folder_id: null } : c)));
      setContextMenu(null);
      setContextMenuView('main');
    } catch (err) {
      console.error('Error removing chat from folder:', err);
      alert('Failed to remove from folder.');
    } finally {
      setIsMovingChat(false);
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
      setContextMenuView('main');
      
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
    setContextMenuView('main');
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleRename = (chatId: number) => {
    setEditingChatId(chatId);
    setContextMenu(null);
    setContextMenuView('main');
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

  const chatsWithoutFolder = chats.filter(chat => !chat.folder_id);
  const foldersGrouped = folders.map(folder => ({
    ...folder,
    chats: chats.filter(chat => chat.folder_id === folder.id)
  }));

  const renderChatItem = (chat: Chat) => {
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
                    <button
                      type="button"
                      className="new-chat-button"
                      onClick={handleNewFolderClick}
                      style={{ marginTop: 6 }}
                    >
                      <FaFolder className="icon" /> New folder
                    </button>
                    {isCreatingFolder && (
                      <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitNewFolder();
                            if (e.key === 'Escape') cancelNewFolder();
                          }}
                          placeholder="Folder name"
                          disabled={isSavingFolder}
                          autoFocus
                          style={{ width: '100%', boxSizing: 'border-box', padding: '4px 6px' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={submitNewFolder}
                            disabled={isSavingFolder || !newFolderName.trim()}
                            style={{ flex: 1, padding: '4px 8px' }}
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={cancelNewFolder}
                            disabled={isSavingFolder}
                            style={{ flex: 1, padding: '4px 8px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="chat-link">
                      <FaComment className="icon" />
                      <span>Chats</span>
                    </div>

                    <div className="chat-scrollable">
                      <ul className="chat-list">
                        {chats.length === 0 && folders.length === 0 && (
                          <li className="no-chats">No chats</li>
                        )}
                        {(chats.length > 0 || folders.length > 0) && (
                          <>
                            {foldersGrouped.map((folder) => (
                              <React.Fragment key={`folder-${folder.id}`}>
                                <li
                                  style={{ listStyle: 'none', fontSize: '0.85em', opacity: 0.75, padding: '0.4em 0.4em 0.2em', fontWeight: 600 }}
                                >
                                  {folder.name}
                                </li>
                                {folder.chats.map(renderChatItem)}
                              </React.Fragment>
                            ))}
                            {chatsWithoutFolder.map(renderChatItem)}
                          </>
                        )}
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

      {contextMenu && (() => {
        const contextChat = chats.find(c => c.id === contextMenu.chatId);
        const contextChatFolderId = contextChat?.folder_id ?? null;
        const folderTargets = folders.filter(f => f.id !== contextChatFolderId);
        return (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => {
              setContextMenu(null);
              setContextMenuView('main');
            }}
          >
            {contextMenuView === 'main' ? (
              <>
                <div className="context-menu-item" onClick={() => !isMovingChat && handleRename(contextMenu.chatId)}>
                  <FaEdit /> Rename
                </div>
                <div
                  className="context-menu-item"
                  onClick={() => !isMovingChat && setContextMenuView('folders')}
                >
                  <FaFolder /> Move to folder
                </div>
                {contextChatFolderId != null && (
                  <div
                    className="context-menu-item"
                    onClick={() => !isMovingChat && removeChatFromFolder(contextMenu.chatId)}
                  >
                    Remove from folder
                  </div>
                )}
                <div className="context-menu-item" onClick={() => !isMovingChat && deleteChat(contextMenu.chatId)}>
                  <FaTrash /> Delete
                </div>
              </>
            ) : (
              <>
                <div
                  className="context-menu-item"
                  onClick={() => !isMovingChat && setContextMenuView('main')}
                  style={{ fontWeight: 600 }}
                >
                  <FaChevronLeft style={{ marginRight: 6 }} /> Back
                </div>
                {folderTargets.length === 0 ? (
                  <div className="context-menu-item" style={{ cursor: 'default', opacity: 0.8 }}>
                    No folders
                  </div>
                ) : (
                  folderTargets.map(folder => (
                    <div
                      key={folder.id}
                      className="context-menu-item"
                      onClick={() => !isMovingChat && moveChatToFolder(contextMenu.chatId, folder.id)}
                    >
                      {folder.name}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        );
      })()}
    </>
  );
};

export default Sidebar;
