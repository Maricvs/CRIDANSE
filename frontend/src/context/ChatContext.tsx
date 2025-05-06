import React, { createContext, useContext, useState, useCallback } from 'react';

interface Message {
  id: number;
  user_id: number;
  chat_id: number;
  role: string;
  message: string;
  created_at: string;
}

interface CreatedChat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_teacher_chat?: boolean;
  teacher_session_id?: number | null;
}

interface ChatContextType {
  messages: Message[];
  isTeacherMode: boolean;
  teacherSessionId: number | null;
  topic?: string | null;
  level?: string | null;
  loading: boolean;
  error: string | null;
  fetchChatInfo: (chatId: number) => Promise<void>;
  fetchMessages: (chatId: number) => Promise<void>;
  sendMessage: (message: string, chatId: number) => Promise<void>;
  toggleTeacherMode: (chatId: number) => Promise<void>;
  createChat: (chat: { user_id?: number, title: string, is_teacher_chat?: boolean }) => Promise<CreatedChat>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setTopic: React.Dispatch<React.SetStateAction<string | null>>;
  setLevel: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherSessionId, setTeacherSessionId] = useState<number | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
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
      setTeacherSessionId(data.teacher_session_id || null);
      if (data.teacher_session_id) {
        const sessionRes = await fetch(`/api/teacher/sessions/${data.teacher_session_id}`);
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setTopic(session.topic || null);
          setLevel(session.level || null);
        } else {
          setTopic(null);
          setLevel(null);
        }
      } else {
        setTopic(null);
        setLevel(null);
      }
    } catch (err) {
      setError("Failed to load chat info");
      setTopic(null);
      setLevel(null);
      console.error('Error loading chat info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId: number) => {
    try {
      setLoading(true);
      setError(null);
      let endpoint;
      let sessionId = teacherSessionId;
      if (isTeacherMode) {
        if (!sessionId) {
          await fetchChatInfo(chatId);
          sessionId = teacherSessionId;
        }
        if (sessionId) {
          endpoint = `/api/teacher/sessions/${sessionId}/messages/`;
        } else {
          setMessages([]);
          return;
        }
      } else {
        endpoint = `/api/chats/messages/by_chat/${chatId}`;
      }
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Error loading messages");
      const data = await res.json();
      const formattedMessages = data.map((msg: Message) => ({
        id: msg.id,
        user_id: msg.user_id,
        chat_id: msg.chat_id,
        role: msg.role,
        message: msg.message,
        created_at: msg.created_at
      }));
      setMessages(formattedMessages);
    } catch (err) {
      setError("Failed to load messages");
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [isTeacherMode, teacherSessionId, fetchChatInfo]);

  const sendMessage = useCallback(async (message: string, chatId: number) => {
    try {
      setLoading(true);
      setError(null);
      let endpoint;
      let body;
      let sessionId = teacherSessionId;
      const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

      if (isTeacherMode) {
        if (!sessionId) {
          await fetchChatInfo(chatId);
          sessionId = teacherSessionId;
        }
        if (!sessionId) throw new Error("No teacher session for this chat");
        endpoint = `/api/teacher/sessions/${sessionId}/messages/`;
        body = JSON.stringify({
          user_id: currentUserId,
          chat_id: chatId,
          role: 'student',
          message
        });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            user_id: currentUserId,
            chat_id: chatId,
            role: 'student',
            message,
            created_at: new Date().toISOString()
          }
        ]);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
        if (!res.ok) throw new Error("Error sending message");
        const aiMsg = await res.json();
        setMessages(prev => [
          ...prev,
          aiMsg
        ]);
        if (sessionId) {
          const sessionRes = await fetch(`/api/teacher/sessions/${sessionId}`);
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            const lastTeacherMsg = aiMsg.role === 'teacher' ? aiMsg : null;
            let t = session.topic;
            let l = session.level;
            if ((!t || !l) && lastTeacherMsg) {
              const match = lastTeacherMsg.message.match(/Тема: ([^;]+); Уровень: ([^\n]+)/);
              if (match) {
                t = match[1].trim();
                l = match[2].trim();
                await fetch(`/api/teacher/sessions/${sessionId}/topic_level`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topic: t, level: l })
                });
              }
            }
            setTopic(t || null);
            setLevel(l || null);
          }
        }
        if (aiMsg.new_title && typeof aiMsg.new_title === 'string' && aiMsg.new_title !== '') {
          const chatsRaw = localStorage.getItem('sidebar_chats');
          if (chatsRaw) {
            try {
              const chats = JSON.parse(chatsRaw);
              const updated = chats.map((c: any) => c.id === chatId ? { ...c, title: aiMsg.new_title } : c);
              localStorage.setItem('sidebar_chats', JSON.stringify(updated));
            } catch {}
          }
          window.dispatchEvent(new CustomEvent('chatTitleUpdated', { detail: { chatId, newTitle: aiMsg.new_title } }));
        }
      } else {
        endpoint = `/api/chats/message`;
        body = JSON.stringify({ 
          chat_id: chatId, 
          message,
          user_id: currentUserId,
          role: 'user'
        });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            user_id: currentUserId,
            chat_id: chatId,
            role: 'user',
            message,
            created_at: new Date().toISOString()
          }
        ]);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
        if (!res.ok) throw new Error("Error sending message");
        const gptRes = await fetch(`/api/gpt/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: message,
            user_id: currentUserId,
            chat_id: chatId
          })
        });
        if (!gptRes.ok) throw new Error("Error generating AI response");
        const gptData = await gptRes.json();
        setMessages(prev => [
          ...prev,
          gptData.message
        ]);
        if (gptData.new_title && typeof gptData.new_title === 'string' && gptData.new_title !== '') {
          const chatsRaw = localStorage.getItem('sidebar_chats');
          if (chatsRaw) {
            try {
              const chats = JSON.parse(chatsRaw);
              const updated = chats.map((c: any) => c.id === chatId ? { ...c, title: gptData.new_title } : c);
              localStorage.setItem('sidebar_chats', JSON.stringify(updated));
            } catch {}
          }
          window.dispatchEvent(new CustomEvent('chatTitleUpdated', { detail: { chatId, newTitle: gptData.new_title } }));
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  }, [isTeacherMode, teacherSessionId, fetchChatInfo]);

  const toggleTeacherMode = useCallback(async (chatId: number) => {
    try {
      setLoading(true);
      setError(null);
      if (!isTeacherMode) {
        const sessionRes = await fetch('/api/teacher/sessions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(localStorage.getItem('user_id') || '0')
          })
        });
        if (!sessionRes.ok) throw new Error("Error creating teacher session");
        const session = await sessionRes.json();
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
      await fetchMessages(chatId);
    } catch (err) {
      setError("Failed to toggle teacher mode");
      console.error('Error toggling teacher mode:', err);
    } finally {
      setLoading(false);
    }
  }, [isTeacherMode, fetchMessages]);

  const createChat = useCallback(async ({ user_id, title, is_teacher_chat = false }: { user_id?: number, title: string, is_teacher_chat?: boolean }) : Promise<CreatedChat> => {
    setLoading(true);
    setError(null);
    try {
      if (!user_id) {
        // Temporary (guest) chat
        const newChat = {
          id: Date.now(),
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isTemporary: true
        };
        const tempChats = JSON.parse(localStorage.getItem('temporary_chats') || '[]');
        localStorage.setItem('temporary_chats', JSON.stringify([newChat, ...tempChats]));
        return newChat;
      }
      // Registered user — create via API
      const response = await fetch('/api/chats/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, title, is_teacher_chat })
      });
      if (!response.ok) throw new Error('Error creating chat');
      const data = await response.json();
      return data;
    } catch (err) {
      setError('Failed to create chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isTeacherMode,
      teacherSessionId,
      topic,
      level,
      loading,
      error,
      fetchChatInfo,
      fetchMessages,
      sendMessage,
      toggleTeacherMode,
      createChat,
      setMessages,
      setLoading,
      setError,
      setTopic,
      setLevel
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