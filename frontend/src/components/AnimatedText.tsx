import React, { useEffect, useState } from 'react';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  speed?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="animated-text">
      {displayedText}
      {currentIndex < text.length && <span className="cursor">|</span>}
    </span>
  );
};

export default AnimatedText; 