import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from "react";
import ChatField from './ChatField';
import './Chat.css';

interface Message {
  id: number;
  role: string;
  message: string;
  created_at: string;
}

interface ChatInfo {
  is_teacher_chat: boolean;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeacherChat, setIsTeacherChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

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
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
      prevMessagesLengthRef.current = messages.length;
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

  const fetchChatInfo = async () => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) throw new Error("Error loading chat info");
      const data: ChatInfo = await res.json();
      setIsTeacherChat(data.is_teacher_chat);
      setLoading(false);
    } catch (err) {
      console.error('Error loading chat info:', err);
      setError("Failed to load chat info");
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      let endpoint;
      if (isTeacherChat) {
        endpoint = `/api/teacher/sessions/${id}/messages`;
      } else {
        endpoint = `/api/chats/messages/by_chat/${id}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Error loading messages");
      const data = await res.json();
      
      // Преобразуем данные в единый формат
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        message: msg.content || msg.message,
        created_at: msg.created_at
      }));
      
      setMessages(formattedMessages);
      
      if (formattedMessages.length > 0) {
        lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1].id;
      }
    } catch (err) {
      setError("Failed to load messages");
    }
  };

  // Загружаем информацию о чате и сообщения при монтировании
  useEffect(() => {
    if (id) {
      initialScrollDoneRef.current = false;
      setLoading(true);
      setError(null);
      fetchChatInfo();
    }
  }, [id]);

  // Загружаем сообщения после получения информации о чате
  useEffect(() => {
    if (id && !loading) {
      fetchMessages();
    }
  }, [id, isTeacherChat, loading]);

  if (error) return <div className="chat-error">{error}</div>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (loading) return <div className="chat-loading">Loading messages...</div>;

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

      <ChatField onMessageSent={fetchMessages} />
    </div>
  );
}
