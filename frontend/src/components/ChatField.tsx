import { RiChatUploadLine } from "react-icons/ri";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import '../ChatField.css';

export default function ChatField() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isTeacherMode,
    loading,
    sendMessage,
    toggleTeacherMode,
    topic,
    level,
    createChat
  } = useChat();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (!id) {
      // Create a new chat with is_teacher_chat based on current mode
      try {
        const user_id = localStorage.getItem('user_id');
        const newChat = await createChat({
          user_id: user_id ? parseInt(user_id) : undefined,
          title: isTeacherMode ? 'New Teacher Chat' : 'New Chat',
          is_teacher_chat: isTeacherMode
        });
        // Сразу переходим в чат, не дожидаясь ответа ИИ
        navigate(`/chat/${newChat.id}`);
        // Отправляем сообщение асинхронно после перехода
        setTimeout(() => {
          sendMessage(message, newChat.id);
          setMessage('');
        }, 0);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    } else {
      const chatId = parseInt(id);
      await sendMessage(message, chatId);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleTeacherMode = async () => {
    if (!id) {
      // Создаем новый чат в режиме учителя
      try {
        const user_id = localStorage.getItem('user_id');
        const newChat = await createChat({
          user_id: user_id ? parseInt(user_id) : undefined,
          title: 'New Teacher Chat',
          is_teacher_chat: true
        });
        await toggleTeacherMode(newChat.id);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    } else {
      const chatId = parseInt(id);
      await toggleTeacherMode(chatId);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="chat-field">
      {/* Topic/Level info bar */}
      {isTeacherMode && topic && level && (
        <div className="teacher-info-bar">
          <span className="teacher-badge">{topic}</span>
          <span className="teacher-badge level">{level}</span>
        </div>
      )}
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTeacherMode ? "Ask your question..." : "Type your message..."}
          disabled={loading}
          rows={1}
          className="fade-in"
        />
        <div className="action-buttons fade-in">
          <button
            onClick={handleToggleTeacherMode}
            className={`chat-action-button ${isTeacherMode ? 'active' : ''}`}
            title={isTeacherMode ? "Disable teacher mode" : "Enable teacher mode"}
            disabled={loading}
          >
            <LiaChalkboardTeacherSolid />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="chat-action-button send-button"
            title="Send message"
          >
            <RiChatUploadLine className="send-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
