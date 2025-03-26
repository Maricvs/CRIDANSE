import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import '../ChatField.css';

const ChatField: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatId = id ? parseInt(id, 10) : null;

  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  // 📥 Загружаем сообщения при наличии chatId
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${chatId}`);
        const data = await response.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Ошибка при загрузке сообщений:', err);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    const userId = localStorage.getItem('user_id');
    const prompt = inputValue;
    setInputValue('');

    try {
      let currentChatId = chatId;

      // Создаём новый чат, если его нет
      if (!currentChatId && !creatingChat) {
        setCreatingChat(true);
        const chatResponse = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId || '0', 10),
            title: 'Новый чат',
          }),
        });

        const newChat = await chatResponse.json();
        currentChatId = newChat.id;
        navigate(`/chat/${currentChatId}`);
      }

      // Отправляем сообщение в GPT
      const response = await fetch('/api/gpt/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user_id: userId,
          chat_id: currentChatId,
        }),
      });

      const data = await response.json();
      const botMessage = { text: data.response || 'Ошибка', isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { text: 'Ошибка при запросе 😢', isUser: false }]);
    }
  };

  return (
    <div className="chat-container-center">
      {messages.length === 0 && (
        <div className="chat-welcome">
          {!chatId ? (
            <>
              <h1>Добро пожаловать!</h1>
              <p>/ на бета-версию UnlimAI \</p>
            </>
          ) : (
            <h2>Чат № {chatId}</h2>
          )}
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
