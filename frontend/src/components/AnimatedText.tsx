import React, { useEffect, useState, useRef } from 'react';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  isNew?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, speed = 50, isNew = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const words = text.split(' ');
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (currentIndex < words.length && isNew) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === words.length) {
      setIsTyping(false);
    }
  }, [currentIndex, words, speed, isNew]);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      setCurrentIndex(words.length);
      setIsTyping(false);
    } else {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsTyping(true);
    }
  }, [text, isNew, words.length]);

  const renderWords = () => {
    return displayedText.split(' ').map((word, index) => (
      <span 
        key={index} 
        className="word" 
        style={{ 
          animationDelay: `${index * 0.1}s`,
          display: 'inline-block'
        }}
      >
        {word}{' '}
      </span>
    ));
  };

  return (
    <div className="message-container">
      <span ref={containerRef} className="animated-text">
        {renderWords()}
        {isTyping && <span className="cursor" />}
      </span>
    </div>
  );
};

export default AnimatedText; 