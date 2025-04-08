import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../ChatField.css';
// import DocumentSelector from './DocumentSelector';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatFieldProps {
  onMessageSent?: () => void;
}

const ChatField: React.FC<ChatFieldProps> = ({ onMessageSent }) => {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const chatId = params.id ? parseInt(params.id, 10) : null;

  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  // const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  const autoRenameChat = async (chatId: number, aiResponse: string) => {
    try {
      const suggestedTitle = aiResponse.split('\n')[0].slice(0, 50);
      
      const response = await fetch(`/api/chats/title/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: suggestedTitle }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при переименовании чата');
      }

      await updateChatsList();
    } catch (err) {
      console.error('Ошибка при автоматическом переименовании:', err);
    }
  };

  const updateChatsList = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const response = await fetch(`/api/chats/user/${userId}`);
      if (!response.ok) {
        throw new Error('Ошибка при обновлении списка чатов');
      }
      const data = await response.json();
      if (onMessageSent) {
        onMessageSent();
      }
      window.dispatchEvent(new Event('messageSent'));
      return data;
    } catch (err) {
      console.error('Ошибка при обновлении списка чатов:', err);
      return null;
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

      if (!currentChatId && !creatingChat) {
        setCreatingChat(true);
        const chatResponse = await fetch('/api/chats/user', {
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
      }

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

      const apiEndpoint = '/api/gpt/ask';
      
      const requestData = {
        prompt,
        user_id: userId,
        chat_id: currentChatId
      };

      const aiResponseFetch = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!aiResponseFetch.ok) {
        throw new Error('Ошибка при получении ответа от ИИ');
      }

      const aiResponse = await aiResponseFetch.json();
      
      if (isNewChat && currentChatId) {
        await autoRenameChat(currentChatId, aiResponse.response || aiResponse.message);
      }

      if (onMessageSent) {
        onMessageSent();
      }

      if (isNewChat && currentChatId) {
        navigate(`/chat/${currentChatId}`);
      }
      
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

  // const handleDocumentsSelected = (documentIds: number[]) => {
  //   setSelectedDocuments(documentIds);
  // };

  return (
    <div className="chat-field">
      <div className="input-container">
        <textarea
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
          placeholder="Введите сообщение..."
          rows={1}
          ref={textareaRef}
        />
        <div className="action-buttons">
          <span className="teacher-mode-icon">🧑‍🏫</span>
          <button className={`send-button ${inputValue.trim() ? 'visible' : ''}`} onClick={handleSendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatField;
