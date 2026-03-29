import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback } from "react";
import ChatField from './ChatField';
import TypewriterMessage from './TypewriterMessage';
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
  const initialMessagesCountRef = useRef(0);

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
      scrollToBottom('auto'); // всегда мгновенно, без анимации
    }
  }, [messages.length, scrollToBottom]);

  // Устанавливаем начальное количество сообщений для определения "новых"
  useEffect(() => {
    if (messages.length > 0 && initialMessagesCountRef.current === 0) {
      initialMessagesCountRef.current = messages.length;
    }
  }, [messages.length]);

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
      initialMessagesCountRef.current = 0; // Сбрасываем счетчик при смене чата
      const chatId = parseInt(id);
      fetchChatInfo(chatId);
      fetchMessages(chatId);
    }
  }, [id, fetchChatInfo, fetchMessages]);

  // Delete empty chat on unmount if no messages (double check: frontend and backend)
  useEffect(() => {
    return () => {
      if (id) {
        fetch(`/api/chats/messages/by_chat/${id}`, {
          headers: { 'X-Authorization': `Bearer ${localStorage.getItem('user_token')}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length === 0 && messages.length === 0) {
              fetch(`/api/chats/delete/${id}`, {
                method: 'DELETE',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
                }
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
        {messages.map((msg, index) => {
          // Новая универсальная логика: ИИ всегда слева, пользователь всегда справа
          const isBotMessage = msg.role === "assistant" || msg.role === "teacher";
          const isNewBotMessage = isBotMessage && initialMessagesCountRef.current > 0 && index >= initialMessagesCountRef.current;
          
          return (
            <div
              key={msg.id}
              className={`message ${isBotMessage ? "bot-message" : "user-message"} fade-in`}
            >
              {isNewBotMessage ? (
                <TypewriterMessage 
                  text={msg.message} 
                  animate={true} 
                  onType={() => scrollToBottom('auto')} 
                />
              ) : (
                msg.message
              )}
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