
import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import WelcomeIntroBlock from './WelcomeIntroBlock';

// ✅ Интерфейс сообщения
interface Message {
  id: number;
  role: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Загружаем сообщения при монтировании
  useEffect(() => {
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

    if (id) fetchMessages();
  }, [id]);

  if (loading) return <p>Загрузка сообщений...</p>;
  if (error) return <p>{error}</p>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (!id) {
    return (
      <div className={wrapperClass}>
        <WelcomeIntroBlock />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <h2>Чат № {id}</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <strong>{msg.role === "user" ? "Вы" : "AI"}:</strong> {msg.message}
            <br />
            <small>{new Date(msg.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
