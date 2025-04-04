import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FaPaperPlane, FaFile } from 'react-icons/fa';
import '../ChatField.css';
import DocumentSelector from './DocumentSelector';

interface ChatFieldProps {
  onMessageSent?: () => void;
}

interface ChatParams {
  id?: string;
}

const ChatField: React.FC<ChatFieldProps> = ({ onMessageSent }) => {
  const { id } = useParams<ChatParams>();
  const navigate = useNavigate();
  const chatId = id ? parseInt(id, 10) : null;

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
    <>
      {showDocumentSelector && (
        <DocumentSelector 
          onDocumentsSelected={handleDocumentsSelected}
          selectedDocuments={selectedDocuments}
        />
      )}

      <div className="chat-input-wrapper">
        <div className="chat-input-container">
          <div className="chat-input-tools">
            <button 
              className={`document-button ${selectedDocuments.length > 0 ? 'active' : ''}`}
              onClick={toggleDocumentSelector}
              title="Выбрать документы для запроса"
            >
              <FaFile size={16} />
              {selectedDocuments.length > 0 && (
                <span className="document-count">{selectedDocuments.length}</span>
              )}
            </button>
          </div>
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
            placeholder={selectedDocuments.length > 0 
              ? "Задайте вопрос по выбранным документам..." 
              : "Что интересного будет сегодня?"}
            className="chat-input"
            rows={1}
          />
          <button className="send-button" onClick={handleSendMessage}>
            <FaPaperPlane size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatField;
