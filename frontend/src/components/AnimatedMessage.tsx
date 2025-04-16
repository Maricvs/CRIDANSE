import React, { useEffect, useState, ReactNode } from 'react';
import './AnimatedMessage.css';

interface AnimatedMessageProps {
  message: string | ReactNode;
  role: 'user' | 'bot';
  isNew?: boolean;
  animateText?: boolean;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ 
  message, 
  role, 
  isNew = false,
  animateText = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isNew) {
      setIsVisible(true);
    }
  }, [isNew]);

  useEffect(() => {
    if (animateText && typeof message === 'string') {
      const words = message.split(' ');
      if (currentIndex < words.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 100);

        return () => clearTimeout(timeout);
      }
    } else if (typeof message === 'string') {
      setDisplayedText(message);
    }
  }, [currentIndex, message, animateText]);

  const content = animateText && typeof message === 'string' 
    ? displayedText + (currentIndex < message.split(' ').length ? '|' : '')
    : message;

  return (
    <div 
      className={`message ${role}-message ${isVisible ? 'visible' : ''} ${isNew ? 'new-message' : ''}`}
    >
      {content}
    </div>
  );
};

export default AnimatedMessage; 