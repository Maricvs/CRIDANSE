import React from 'react';
import { useParams } from 'react-router-dom';

const Chat: React.FC = () => {
  const { id } = useParams();

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px' }}>
      <h2>Чат № {id}</h2>
      <div>
        Тут будут сообщения чата с id {id}
      </div>
    </div>
  );
};

export default Chat;
