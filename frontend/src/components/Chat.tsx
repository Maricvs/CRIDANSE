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
    fetchMessages,
    isTeacherMode,
    teacherProgress
  } = useChat();

  const hasTeacherProgressBlock =
    isTeacherMode &&
    (
      (teacherProgress.status != null && teacherProgress.status !== '') ||
      (teacherProgress.current_objective != null && teacherProgress.current_objective !== '') ||
      (teacherProgress.completion_estimate !== null && teacherProgress.completion_estimate !== undefined)
    );
  
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

  // Загружаем информацию о чате, затем сообщения (последовательно; история всегда через messages/by_chat)
  useEffect(() => {
    if (!id) return;
    initialScrollDoneRef.current = false;
    initialMessagesCountRef.current = 0;
    const chatId = parseInt(id, 10);
    let cancelled = false;
    (async () => {
      await fetchChatInfo(chatId);
      if (cancelled) return;
      await fetchMessages(chatId);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fetchChatInfo, fetchMessages]);

  // Delete empty chat only when leaving this chat (id change or unmount). Do not depend on messages.length
  // or cleanup runs on first send and can race DELETE before /api/gpt/ask completes.
  useEffect(() => {
    const chatId = id;
    return () => {
      if (!chatId) return;
      fetch(`/api/chats/messages/by_chat/${chatId}`, {
        headers: { 'X-Authorization': `Bearer ${localStorage.getItem('user_token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length === 0) {
            fetch(`/api/chats/delete/${chatId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'X-Authorization': `Bearer ${localStorage.getItem('user_token')}`
              }
            });
          }
        });
    };
  }, [id]);

  // Определяем текущий user_id
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  // Определяем, нужно ли показывать индикатор "думаю"
  const lastMsg = messages[messages.length - 1];
  const showThinking = loading && lastMsg && lastMsg.role === 'user' && lastMsg.user_id === currentUserId;

  if (error) return <div className="chat-error">{error}</div>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  return (
    <div className={wrapperClass}>
      <div className="chat-messages">
        {hasTeacherProgressBlock && (
          <div
            className="teacher-progress-compact"
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
          >
            {teacherProgress.status != null && teacherProgress.status !== '' && (
              <div>Status: {teacherProgress.status}</div>
            )}
            {teacherProgress.current_objective != null && teacherProgress.current_objective !== '' && (
              <div>Objective: {teacherProgress.current_objective}</div>
            )}
            {teacherProgress.completion_estimate != null && (
              <div>Progress: {teacherProgress.completion_estimate}%</div>
            )}
          </div>
        )}
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