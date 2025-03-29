import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import '../ChatField.css';

const ChatField: React.FC<{ onMessageSent?: () => void }> = ({ onMessageSent }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatId = id ? parseInt(id, 10) : null;

  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  // Функция для автоматического переименования чата
  const autoRenameChat = async (chatId: number, aiResponse: string) => {
    try {
      // Извлекаем первые 50 символов из ответа ИИ для названия
      const suggestedTitle = aiResponse.split('\n')[0].slice(0, 50);
      
      const response = await fetch(`/api/chat/title/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: suggestedTitle }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при переименовании чата');
      }
    } catch (err) {
      console.error('Ошибка при автоматическом переименовании:', err);
    }
  };

  // Функция для обновления списка чатов
  const updateChatsList = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const response = await fetch(`/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Ошибка при обновлении списка чатов');
      }
      await response.json(); // Просто проверяем, что ответ валидный
      // Обновляем состояние в родительском компоненте
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error('Ошибка при обновлении списка чатов:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userId = localStorage.getItem('user_id');
    const prompt = inputValue;
    setInputValue('');

    try {
      let currentChatId = chatId;
      let isNewChat = false;

      // Создаём чат, если его нет
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

        if (!chatResponse.ok) {
          throw new Error('Ошибка при создании чата');
        }

        const newChat = await chatResponse.json();
        currentChatId = newChat.id;
        isNewChat = true;
        
        // Обновляем список чатов после создания нового
        await updateChatsList();
        
        navigate(`/chat/${currentChatId}`);
      }

      // Сохраняем сообщение пользователя
      const messageResponse = await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId || '0', 10),
          chat_id: currentChatId,
          role: 'user',
          message: prompt,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Ошибка при сохранении сообщения');
      }

      // Отправляем в GPT
      const gptResponse = await fetch('/api/gpt/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user_id: userId,
          chat_id: currentChatId,
        }),
      });

      if (!gptResponse.ok) {
        throw new Error('Ошибка при получении ответа от ИИ');
      }

      const aiResponse = await gptResponse.json();
      
      // Если это новый чат, переименовываем его на основе ответа ИИ
      if (isNewChat && currentChatId) {
        await autoRenameChat(currentChatId, aiResponse.message);
        // Обновляем список чатов после переименования
        await updateChatsList();
      }

      // Обновляем сообщения в чате
      if (onMessageSent) onMessageSent();
      
    } catch (err: any) {
      console.error('Ошибка:', err);
      alert(err.message || 'Произошла неизвестная ошибка');
    } finally {
      setCreatingChat(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!chatId) return;
  }, [chatId]);

  return (
    <>

      <div className="chat-input-wrapper">
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
