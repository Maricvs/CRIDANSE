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

  if (error) return <div className="chat-error">{error}</div>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className="chat-messages">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="skeleton-message" />
          ))}
        </div>
        <ChatField />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-message">
            Start a new conversation by sending a message
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.role === "user" ? "user-message" : "bot-message"}`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} className="messages-end-anchor" />
      </div>

      <ChatField />
    </div>
  );
}
