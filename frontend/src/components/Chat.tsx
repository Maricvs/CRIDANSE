import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback } from "react";
import ChatField from './ChatField';
import './Chat.css';
import { useChat } from '../context/ChatContext';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const {
    messages,
    loading,
    error,
    fetchChatInfo,
    fetchMessages
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);

  // Проверяем валидность id сразу
  if (!id || id === 'undefined' || id === null || id === '') {
    return <div className="chat-error">Invalid chat ID</div>;
  }

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: "end",
        inline: "nearest"
      });
    }
  }, []);

  // Прокрутка при изменении сообщений
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Начальная прокрутка после загрузки
  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
      scrollToBottom("auto");
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages.length, scrollToBottom]);

  // Прокрутка при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (messages.length > 0) {
        scrollToBottom("auto");
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [messages.length, scrollToBottom]);

  // Загружаем информацию о чате и сообщения при монтировании
  useEffect(() => {
    if (id) {
      initialScrollDoneRef.current = false;
      const chatId = parseInt(id);
      fetchChatInfo(chatId);
      fetchMessages(chatId);
    }
  }, [id, fetchChatInfo, fetchMessages]);

  // Delete empty chat on unmount if no messages (double check: frontend and backend)
  useEffect(() => {
    return () => {
      if (id) {
        fetch(`/api/chats/messages/by_chat/${id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length === 0 && messages.length === 0) {
              fetch(`/api/chats/delete/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
            }
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, messages.length]);

  // Определяем текущий user_id
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  // Определяем, нужно ли показывать индикатор "думаю"
  const lastMsg = messages[messages.length - 1];
  const showThinking = loading && lastMsg && (lastMsg.role === 'user' || lastMsg.role === 'student') && lastMsg.user_id === currentUserId;

  if (error) return <div className="chat-error">{error}</div>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  return (
    <div className={wrapperClass}>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-message">
            Start a new conversation by sending a message
          </div>
        )}
        {messages.map((msg) => {
          // Определяем, является ли сообщение пользовательским
          const isMyMessage = (
            (msg.role === "user" && msg.user_id === currentUserId) ||
            (msg.role === "student" && msg.user_id === currentUserId)
          );
          return (
            <div
              key={msg.id}
              className={`message ${isMyMessage ? "user-message" : "bot-message"} fade-in`}
            >
              {msg.message || msg.content}
            </div>
          );
        })}
        {showThinking && (
          <div className="message bot-message thinking-indicator fade-in">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        )}
        <div ref={messagesEndRef} className="messages-end-anchor" />
      </div>
      <ChatField />
    </div>
  );
}
