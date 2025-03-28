import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import WelcomeIntroBlock from './WelcomeIntroBlock';
import ChatField from './ChatField';

export default function Chat() {
  const { id } = useParams();
  console.log("ID из useParams:", id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/messages/by_chat/${id}`);
        if (!res.ok) throw new Error("Ошибка при загрузке сообщений");
        const data = await res.json();


      } catch (err) {
        setError("Не удалось загрузить сообщения");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMessages();
  }, [id]);

  if (error) return <p>{error}</p>;

  const isWideScreen = window.innerWidth >= 768;
  const wrapperClass = isWideScreen ? 'chat-wrapper with-sidebar' : 'chat-wrapper';

  if (!id || id === 'undefined' || id === null || id === '') {
    return (
      <div className={wrapperClass}>
        <WelcomeIntroBlock />
      </div>
    );
  }

  if (loading) return <p>Загрузка сообщений...</p>;

  return (
    <div className={wrapperClass}>
      <ChatField />
    </div>
  );
}
