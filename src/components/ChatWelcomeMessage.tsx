// ChatWelcomeMessage.tsx
import React from 'react';
import '../ChatWelcomeMessage.css'; // Путь к CSS файлу для стилизации

const ChatWelcomeMessage: React.FC = () => {
  return (
    <div className="chat-welcome-message">
      <h1>Добро пожаловать!</h1>
      <h2>/ на бета-версию UnlimAI \</h2>
    </div>
  );
};

export default ChatWelcomeMessage;
