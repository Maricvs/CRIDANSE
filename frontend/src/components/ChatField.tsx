import { RiChatUploadLine } from "react-icons/ri";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import '../ChatField.css';

export default function ChatField() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isTeacherMode,
    loading,
    sendMessage,
    toggleTeacherMode
  } = useChat();

  const handleSendMessage = async () => {
    if (!message.trim() || !id) return;

    const chatId = parseInt(id);
    await sendMessage(message, chatId);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleTeacherMode = async () => {
    if (!id) return;
    const chatId = parseInt(id);
    await toggleTeacherMode(chatId);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="chat-field">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTeacherMode ? "Ask your question..." : "Type your message..."}
          disabled={loading}
          rows={1}
        />
        <div className="action-buttons">
          <button
            onClick={handleToggleTeacherMode}
            className={`chat-action-button ${isTeacherMode ? 'active' : ''}`}
            title={isTeacherMode ? "Disable teacher mode" : "Enable teacher mode"}
            disabled={loading}
          >
            <LiaChalkboardTeacherSolid />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="chat-action-button send-button"
            title="Send message"
          >
            <RiChatUploadLine className="send-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
