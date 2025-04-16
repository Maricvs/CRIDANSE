import React, { useEffect, useState } from 'react';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  isNew?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, speed = 100, isNew = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    if (currentIndex < words.length && isNew) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, words, speed, isNew]);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      setCurrentIndex(words.length);
    } else {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text, isNew, words.length]);

  return (
    <span className="animated-text">
      {displayedText}
      {currentIndex < words.length && isNew && <span className="cursor">|</span>}
    </span>
  );
};

export default AnimatedText; 