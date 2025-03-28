import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import '../ChatField.css';

const ChatField: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatId = id ? parseInt(id, 10) : null;

  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userId = localStorage.getItem('user_id');
    const prompt = inputValue;
    setInputValue('');



    setMessages((prevMessages) => [
    ...prevMessages,
    {
      id: Date.now(), // временный ID
      chat_id: chatId,
      user_id: parseInt(userId || '0', 10),
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    },
  ]);


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
      // Сохраняем сообщение в базе
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId || '0', 10),
          chat_id: currentChatId,
          role: 'user',
          message: prompt,
        }),
      });
      await fetch('/api/gpt/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user_id: userId,
          chat_id: currentChatId,
        }),
      });

    } catch (err) {
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
        <div className="chat-messages">
       {messages.map((msg) => (
         <div
           key={msg.id}
           className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
         >
           {msg.content}
         </div>
       ))}
     </div>
      <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        placeholder="Что интересного будет сегодня?"
        className="chat-input"
        rows={1}
        />
        <button className="send-button" onClick={handleSendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
    </>
  );
};

export default ChatField;
