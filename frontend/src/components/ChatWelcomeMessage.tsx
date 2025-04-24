// ChatWelcomeMessage.tsx
import React from 'react';
import '../ChatWelcomeMessage.css'; // Путь к CSS файлу для стилизации

const ChatWelcomeMessage: React.FC = () => {
  return (
    <div className="chat-welcome-message">
      <h1>Welcome!</h1>
      <h2>/ to CRIDANSE beta version \</h2>
    </div>
  );
};

export default ChatWelcomeMessage;
