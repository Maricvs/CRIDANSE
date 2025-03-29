// WelcomeIntroBlock.tsx
import React from 'react';
import '../WelcomeIntroBlock.css';

const WelcomeIntroBlock: React.FC = () => {
  return (
    <div className="welcome-intro-block">

      <h2 className="welcome-title">Hi, I'm CRIDANSE.</h2>
      <p className="welcome-subtitle">Your personal learning assistant</p>
    </div>
  );
};

export default WelcomeIntroBlock;


  // 👇 Отправляем в GPT <img src="/logo192.png" alt="Logo" className="welcome-logo" />
