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

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef<boolean>(false);

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

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chats/messages/by_chat/${id}`);
      if (!res.ok) throw new Error("Ошибка при загрузке сообщений");
      const data = await res.json();
      setMessages(data);
      
      if (data.length > 0) {
        lastMessageIdRef.current = data[data.length - 1].id;
      }
    } catch (err) {
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      initialScrollDoneRef.current = false;
      fetchMessages();
      prevMessagesLengthRef.current = 0;
    }
  }, [id]);

  if (error) return <div className="chat-error">{error}</div>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (!id || id === 'undefined' || id === null || id === '') {
    return null;
  }

  if (loading) return <div className="chat-loading">Загрузка сообщений...</div>;

  return (
    <div className={wrapperClass}>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-message">
            Начните новую беседу, отправив сообщение
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
