import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import ChatWelcomeMessage from './ChatWelcomeMessage'; // Импортируем компонент
import '../ChatField.css';

const ChatField: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasMessage, setHasMessage] = useState(false); // Состояние для отслеживания сообщений

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, isUser: true }]);
      setInputValue('');
      setHasMessage(true); // Помечаем, что сообщение введено
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: 'Это ответ бота!', isUser: false }]);
      }, 1000);
    }
  };

  return (
    <div className="chat-container-center">
      {!hasMessage && <ChatWelcomeMessage />} {/* Показываем приветственное сообщение, если нет сообщений */}

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
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Введите сообщение..."
          className="chat-input"
        />
        <button
          onClick={handleSendMessage}
          className={`send-button ${inputValue.trim() ? 'active' : ''}`}
          disabled={!inputValue.trim()}
        >
          <FaPaperPlane className="send-icon" />
        </button>
      </div>
    </div>
  );
};

export default ChatField;
