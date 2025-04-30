import React, { createContext, useContext, useState, useCallback } from 'react';

interface Message {
  id: number;
  user_id: number;
  chat_id: number;
  role: string;
  message: string;
  created_at: string;
}

interface ChatContextType {
  messages: Message[];
  isTeacherMode: boolean;
  teacherSessionId: number | null;
  loading: boolean;
  error: string | null;
  fetchChatInfo: (chatId: number) => Promise<void>;
  fetchMessages: (chatId: number) => Promise<void>;
  sendMessage: (message: string, chatId: number) => Promise<void>;
  toggleTeacherMode: (chatId: number) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherSessionId, setTeacherSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatInfo = useCallback(async (chatId: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Error loading chat info");
      const data = await res.json();
      setIsTeacherMode(data.is_teacher_chat);
      if (data.teacher_session_id) {
        setTeacherSessionId(data.teacher_session_id);
      }
    } catch (err) {
      setError("Failed to load chat info");
      console.error('Error loading chat info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId: number) => {
    try {
      let endpoint;
      if (isTeacherMode) {
        if (!teacherSessionId) {
          // Создаем новую сессию учителя
          const res = await fetch('/api/teacher/sessions/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: parseInt(localStorage.getItem('user_id') || '0'),
              topic: 'Общее обучение',
              level: 'intermediate'
            })
          });
          if (!res.ok) throw new Error("Error creating teacher session");
          const session = await res.json();
          setTeacherSessionId(session.id);
          endpoint = `/api/teacher/sessions/${session.id}/messages/`;
        } else {
          endpoint = `/api/teacher/sessions/${teacherSessionId}/messages/`;
        }
      } else {
        endpoint = `/api/chats/messages/by_chat/${chatId}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Error loading messages");
      const data = await res.json();
      
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        message: msg.content || msg.message,
        created_at: msg.created_at
      }));
      
      setMessages(formattedMessages);
    } catch (err) {
      setError("Failed to load messages");
      console.error('Error loading messages:', err);
    }
  }, [isTeacherMode, teacherSessionId]);

  const sendMessage = useCallback(async (message: string, chatId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          user_id: parseInt(localStorage.getItem('user_id') || '0'),
          chat_id: chatId,
          role: 'user',
          message,
          created_at: new Date().toISOString()
        }
      ]);

      let endpoint;
      let body;

      if (isTeacherMode) {
        if (!teacherSessionId) {
          // Создаем новую сессию учителя
          const res = await fetch('/api/teacher/sessions/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: parseInt(localStorage.getItem('user_id') || '0'),
              topic: 'Общее обучение',
              level: 'intermediate'
            })
          });
          if (!res.ok) throw new Error("Error creating teacher session");
          const session = await res.json();
          setTeacherSessionId(session.id);
        }
        endpoint = `/api/teacher/sessions/${teacherSessionId}/messages/`;
        body = JSON.stringify({ 
          session_id: teacherSessionId,
          content: message,
          role: 'student'
        });
      } else {
        endpoint = `/api/chats/message`;
        body = JSON.stringify({ 
          chat_id: chatId, 
          message,
          user_id: parseInt(localStorage.getItem('user_id') || '0'),
          role: 'user'
        });
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!res.ok) throw new Error("Error sending message");
      
      // После отправки сообщения обновляем список сообщений
      await fetchMessages(chatId);
    } catch (err) {
      setError("Failed to send message");
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  }, [isTeacherMode, teacherSessionId, fetchMessages]);

  const toggleTeacherMode = useCallback(async (chatId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Если включаем режим учителя
      if (!isTeacherMode) {
        // Создаем сессию учителя
        const sessionRes = await fetch('/api/teacher/sessions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(localStorage.getItem('user_id') || '0'),
            topic: 'Общее обучение',
            level: 'intermediate'
          })
        });

        if (!sessionRes.ok) throw new Error("Error creating teacher session");
        const session = await sessionRes.json();
        
        // Обновляем чат с teacher_session_id
        const res = await fetch(`/api/chats/${chatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            is_teacher_chat: true,
            teacher_session_id: session.id 
          })
        });

        if (!res.ok) throw new Error("Error toggling teacher mode");
        
        setTeacherSessionId(session.id);
        setIsTeacherMode(true);
      } else {
        // Выключаем режим учителя
        const res = await fetch(`/api/chats/${chatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            is_teacher_chat: false,
            teacher_session_id: null 
          })
        });

        if (!res.ok) throw new Error("Error toggling teacher mode");
        
        setTeacherSessionId(null);
        setIsTeacherMode(false);
      }

      // После переключения режима обновляем сообщения
      await fetchMessages(chatId);
    } catch (err) {
      setError("Failed to toggle teacher mode");
      console.error('Error toggling teacher mode:', err);
    } finally {
      setLoading(false);
    }
  }, [isTeacherMode, fetchMessages]);

  return (
    <ChatContext.Provider value={{
      messages,
      isTeacherMode,
      teacherSessionId,
      loading,
      error,
      fetchChatInfo,
      fetchMessages,
      sendMessage,
      toggleTeacherMode,
      setMessages,
      setLoading,
      setError
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};