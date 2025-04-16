import React, { useEffect, useState, useRef } from 'react';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  isNew?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, speed = 100, isNew = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(' ');
  const containerRef = useRef<HTMLSpanElement>(null);

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
      setIsVisible(true);
    } else {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsVisible(false);
    }
  }, [text, isNew, words.length]);

  useEffect(() => {
    if (displayedText && isNew) {
      setIsVisible(true);
    }
  }, [displayedText, isNew]);

  const renderWords = () => {
    return displayedText.split(' ').map((word, index) => (
      <span key={index} className="word" style={{ animationDelay: `${index * 0.1}s` }}>
        {word}{' '}
      </span>
    ));
  };

  return (
    <span 
      ref={containerRef}
      className={`animated-text ${isVisible ? 'fade-in' : ''}`}
    >
      {renderWords()}
      {currentIndex < words.length && isNew && <span className="cursor">|</span>}
    </span>
  );
};

export default AnimatedText; 