import React, { useState } from 'react';
import { askGPT } from '../api/api';
import { FaPaperPlane } from 'react-icons/fa';
import ChatWelcomeMessage from './ChatWelcomeMessage';
import '../styles/ChatField.css';
import { useParams } from 'react-router-dom'; // ✅ получаем chat_id из URL

const ChatField: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasMessage, setHasMessage] = useState(false);

  const { id: chatId } = useParams(); // ✅ получаем chat_id из URL
  const user_id = localStorage.getItem('user_id'); // ✅ берём user_id из хранилища

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !chatId || !user_id) return;

    const userMessage = { text: trimmed, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setHasMessage(true);

    try {
      // ✅ Сохраняем сообщение пользователя в базу
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(user_id),
          chat_id: Number(chatId),
          role: 'user',
          message: trimmed,
        }),
      });

      // ✅ Запрашиваем ответ от модели
      const res = await askGPT({ prompt: trimmed });
      const botMessage = { text: res.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      // ✅ Сохраняем ответ бота в базу
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(user_id),
          chat_id: Number(chatId),
          role: 'assistant',
          message: res.response,
        }),
      });
    } catch (err) {
      const errorMessage = { text: 'Ошибка при запросе 😢', isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="chat-container-center">
      {!hasMessage && <ChatWelcomeMessage />}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Введите сообщение..."
          className="chat-input"
        />
        <button
          onClick={handleSendMessage}
          className={`send-button ${inputValue.trim() ? 'active' : ''}`}
          disabled={!inputValue.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatField;
