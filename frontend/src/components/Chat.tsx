import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";
import WelcomeIntroBlock from './WelcomeIntroBlock';
import ChatField from './ChatField';

interface Message {
  id: number;
  role: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { id } = useParams();
  console.log("ID из useParams:", id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chats/messages/by_chat/${id}`);
      if (!res.ok) throw new Error("Ошибка при загрузке сообщений");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMessages();
  }, [id]);

  if (error) return <p>{error}</p>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (!id || id === 'undefined' || id === null || id === '') {
  return (
    <div
      className={wrapperClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <WelcomeIntroBlock />
      <div style={{ marginTop: '2rem', width: '100%', maxWidth: '768px' }}>
        <ChatField />
      </div>
    </div>
  );
}
  if (loading) return <p>Загрузка сообщений...</p>;

  return (
    <div className={wrapperClass}>
    <div className="chat-messages">
  {messages.map((msg) => (
    <div
      key={msg.id}
      className={`message ${msg.role === "user" ? "user-message" : "bot-message"}`}
    >
      {msg.message}
    </div>
  ))}
  <div ref={messagesEndRef} />
  </div>

      <ChatField onMessageSent={fetchMessages} />
    </div>
  );
}
