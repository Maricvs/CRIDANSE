import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import '../ChatField.css';
import DocumentSelector from './DocumentSelector';

interface ChatFieldProps {
  onMessageSent?: () => void;
}

interface RouteParams {
  id?: string;
}

const ChatField: React.FC<ChatFieldProps> = ({ onMessageSent }) => {
  const params = useParams<RouteParams>();
  const navigate = useNavigate();
  const chatId = params.id ? parseInt(params.id, 10) : null;

  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  // Функция для автоматического переименования чата
  const autoRenameChat = async (chatId: number, aiResponse: string) => {
    try {
      // Извлекаем первые 50 символов из ответа ИИ для названия
      const suggestedTitle = aiResponse.split('\n')[0].slice(0, 50);
      
      const response = await fetch(`/api/chats/title/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: suggestedTitle }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при переименовании чата');
      }

      // Обновляем список чатов после переименования
      await updateChatsList();
    } catch (err) {
      console.error('Ошибка при автоматическом переименовании:', err);
    }
  };

  // Функция для обновления списка чатов
  const updateChatsList = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const response = await fetch(`/api/chats/user/${userId}`);
      if (!response.ok) {
        throw new Error('Ошибка при обновлении списка чатов');
      }
      const data = await response.json();
      // Вызываем колбэк для обновления списка чатов
      if (onMessageSent) {
        onMessageSent();
      }
      // Отправляем событие для обновления списка чатов
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

      // Создаём чат, если его нет
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

      // Определяем, куда отправлять запрос в зависимости от выбора документов
      const apiEndpoint = selectedDocuments.length > 0 
        ? '/api/document_ai/service/ask_with_documents'
        : '/api/gpt/ask';
      
      // Формируем данные запроса
      const requestData = selectedDocuments.length > 0
        ? {
            prompt,
            user_id: userId,
            chat_id: currentChatId,
            document_ids: selectedDocuments
          }
        : {
            prompt,
            user_id: userId,
            chat_id: currentChatId
          };

      // Отправляем запрос к AI
      const aiResponseFetch = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!aiResponseFetch.ok) {
        throw new Error('Ошибка при получении ответа от ИИ');
      }

      const aiResponse = await aiResponseFetch.json();
      
      // Если это новый чат, переименовываем его на основе ответа ИИ
      if (isNewChat && currentChatId) {
        await autoRenameChat(currentChatId, aiResponse.response || aiResponse.message);
      }

      // Обновляем список сообщений только после того, как все операции завершены
      if (onMessageSent) {
        onMessageSent();
      }

      // Если это новый чат, делаем навигацию после всех операций
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

  // Обработчик для переключения видимости селектора документов
  const toggleDocumentSelector = () => {
    setShowDocumentSelector(!showDocumentSelector);
  };

  // Обработчик для обновления выбранных документов
  const handleDocumentsSelected = (documentIds: number[]) => {
    setSelectedDocuments(documentIds);
  };

  return (
    <div className="chat-field">
      {showDocumentSelector && (
        <DocumentSelector
          onDocumentsSelected={handleDocumentsSelected}
          selectedDocuments={selectedDocuments}
        />
      )}
      <div className="input-container">
        <button className="file-button" onClick={() => setShowDocumentSelector(true)}>
          <Icons.FaFile />
        </button>
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
        <button className="send-button" onClick={handleSendMessage}>
          <Icons.FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatField;
