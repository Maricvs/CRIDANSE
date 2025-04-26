import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../ChatField.css';
import { RiChatUploadLine } from "react-icons/ri";
import { LiaChalkboardTeacherSolid } from 'react-icons/lia';

interface ChatFieldProps {
  onMessageSent?: () => void;
}

interface TeacherResponse {
  response: string;
  session_id?: number;
}

const ChatField: React.FC<ChatFieldProps> = ({ onMessageSent }) => {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const chatId = params.id ? parseInt(params.id, 10) : null;

  const [inputValue, setInputValue] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherSessionId, setTeacherSessionId] = useState<number | null>(null);
  // const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  // Загружаем информацию о чате при монтировании
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (chatId) {
        try {
          const response = await fetch(`/api/chats/${chatId}`);
          if (response.ok) {
            const chat = await response.json();
            setIsTeacherMode(chat.is_teacher_chat);
          }
        } catch (err) {
          console.error('Error loading chat information:', err);
        }
      }
    };
    fetchChatInfo();
  }, [chatId]);

  const autoRenameChat = async (chatId: number, aiResponse: string) => {
    try {
      const suggestedTitle = aiResponse.split('\n')[0].slice(0, 50);
      
      const response = await fetch(`/api/chats/title/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: suggestedTitle }),
      });

      if (!response.ok) {
        throw new Error('Error renaming chat');
      }

      await updateChatsList();
    } catch (err) {
      console.error('Error during automatic renaming:', err);
    }
  };

  const updateChatsList = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const response = await fetch(`/api/chats/user/${userId}`);
      if (!response.ok) {
        throw new Error('Error updating chat list');
      }
      const data = await response.json();
      if (onMessageSent) {
        onMessageSent();
      }
      window.dispatchEvent(new Event('messageSent'));
      return data;
    } catch (err) {
      console.error('Error updating chat list:', err);
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
            title: 'New chat',
            is_teacher_chat: isTeacherMode
          }),
        });

        if (!chatResponse.ok) {
          throw new Error('Error creating chat');
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
        throw new Error('Error saving message');
      }

      let apiEndpoint;
      let requestData;
      
      if (isTeacherMode) {
        // Используем расширенный режим учителя
        apiEndpoint = '/api/teacher/ask';
        requestData = {
          prompt,
          user_id: parseInt(userId || '0', 10),
          ...(teacherSessionId && { session_id: teacherSessionId })
        };
      } else {
        // Обычный режим
        apiEndpoint = '/api/gpt/ask';
        requestData = {
          prompt,
          user_id: parseInt(userId || '0', 10),
          chat_id: currentChatId
        };
      }

      const aiResponseFetch = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!aiResponseFetch.ok) {
        throw new Error('Error in teacher mode. We are fixing it.');
      }

      const aiResponse: TeacherResponse = await aiResponseFetch.json();
      
      // Сохраняем ID сессии учителя, если он был возвращен
      if (isTeacherMode && aiResponse.session_id) {
        setTeacherSessionId(aiResponse.session_id);
      }
      
      if (isNewChat && currentChatId) {
        await autoRenameChat(currentChatId, aiResponse.response);
      }

      if (onMessageSent) {
        onMessageSent();
      }

      if (isNewChat && currentChatId) {
        navigate(`/chat/${currentChatId}`);
      }
      
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'An unknown error occurred');
    } finally {
      setCreatingChat(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!chatId) return;
  }, [chatId]);

  // Сбрасываем ID сессии учителя при выключении режима
  useEffect(() => {
    if (!isTeacherMode) {
      setTeacherSessionId(null);
    }
  }, [isTeacherMode]);

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
          placeholder="Enter message..."
          rows={1}
          ref={textareaRef}
        />
        <div className="action-buttons">
          <button 
            className={`chat-action-button ${isTeacherMode ? 'active' : ''}`} 
            onClick={() => {
              // Если чат существует и это учебный чат, не позволяем выключить режим
              if (chatId && isTeacherMode) {
                alert('Teacher mode cannot be turned off in a learning chat.');
                return;
              }
              setIsTeacherMode(!isTeacherMode);
            }}
            title={isTeacherMode ? 'Turn off teacher mode' : 'Turn on teacher mode'}
          >
            <LiaChalkboardTeacherSolid />
          </button>
          <button className="chat-action-button" onClick={handleSendMessage}>
            <RiChatUploadLine />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatField;
