import React, { useState } from 'react';
import { askGPT } from '../api/api';
import { FaPaperPlane } from 'react-icons/fa';
import ChatWelcomeMessage from './ChatWelcomeMessage'; // Импортируем компонент
//import '../ChatField.css'; 1 ver style
import '../styles/ChatField.css';  // Подключаем стили

const ChatField: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasMessage, setHasMessage] = useState(false); // Состояние для отслеживания сообщений

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage = { text: trimmed, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setHasMessage(true);

    try {
      const res = await askGPT({ prompt: trimmed });
      const botMessage = { text: res.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = { text: 'Ошибка при запросе к GPT 😢', isUser: false };
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
