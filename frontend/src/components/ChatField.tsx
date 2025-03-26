import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatField.css';

const ChatField: React.FC = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatId = id ? parseInt(id, 10) : null;

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    fetch('/api/gpt/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: inputValue,
        user_id: localStorage.getItem('user_id'),
        chat_id: chatId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const botMessage = { text: data.response || 'Ошибка', isUser: false };
        setMessages((prev) => [...prev, botMessage]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { text: 'Ошибка при запросе 😢', isUser: false }]);
      });
  };

  const hasMessage = messages.length > 0;

  return (
    <div className="chat-container-center">
      {!hasMessage && (
        <div className="chat-welcome">
          <h1>Добро пожаловать!</h1>
          <p>/ на бета-версию UnlimAI \</p>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${message.isUser ? 'user' : 'bot'}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Введите сообщение..."
          className="chat-input"
          rows={1}
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
