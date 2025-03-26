import React, { useState } from 'react';
import { askGPT } from '../api/api';
import { FaPaperPlane } from 'react-icons/fa';
import ChatWelcomeMessage from './ChatWelcomeMessage';
import '../styles/ChatField.css';
import { useParams } from 'react-router-dom';

// ✅ Новое: принимаем chatId как необязательный проп
interface ChatFieldProps {
  chatId?: number;
}

const ChatField: React.FC<ChatFieldProps> = ({ chatId: propChatId }) => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasMessage, setHasMessage] = useState(false);

  const { id: urlChatId } = useParams();
  const effectiveChatId = propChatId ?? Number(urlChatId); // ✅ используем либо prop, либо URL

  const user_id = localStorage.getItem('user_id');

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !user_id) return;

    const userMessage = { text: trimmed, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setHasMessage(true);

    try {
      // ✅ Сохраняем сообщение пользователя
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(user_id),
          chat_id: effectiveChatId,
          role: 'user',
          message: trimmed,
        }),
      });

      const res = await askGPT({
        prompt: trimmed,
        user_id: Number(user_id),
        chat_id: effectiveChatId,
      });
      const botMessage = { text: res.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      // ✅ Сохраняем ответ бота
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(user_id),
          chat_id: effectiveChatId,
          role: 'assistant',
          message: res.response,
        }),
      });
    } catch (err) {
      const errorMessage = { text: 'Ошибка при запросе 😢', isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    }
    console.log("👉 GPT запрос:", {
      prompt: trimmed,
      user_id: Number(user_id),
      chat_id: effectiveChatId,
    });
  };

    // Временно вставим это в верхнюю часть ChatField.tsx, до return:
  const fakeChatData = {
    messages: [
      { role: "user", content: "Привет! Это тестовое сообщение." },
      { role: "assistant", content: "Привет! Я тебя слышу, это ответ бота." },
      { role: "user", content: "Супер, значит фронт работает." },
    ],
  };

  // Используем временно: если chatData не пришёл — берём фейковый
  const messagesToRender = messages.length > 0 ? messages : fakeChatData.messages;

  return (
    <div className="chat-container-center">
      {!hasMessage && <ChatWelcomeMessage />}
//      <div className="chat-messages">
//        {messages.map((message, index) => (
//          <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
//            {message.text}
//          </div>
//        ))}
//      </div>
        <div className="flex flex-col gap-4 p-4">
        {messagesToRender.map((message, index) => (
        <div
        key={index}
        className={`max-w-[85%] px-4 py-2 rounded-xl whitespace-pre-line ${
          message.role === "user"
            ? "bg-white text-black self-end"
            : "bg-slate-900 text-white self-start"
        }`}
        >
        {message.content}
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
