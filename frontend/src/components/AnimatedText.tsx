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
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span className="animated-text">{displayedText}</span>;
};

export default AnimatedText; 