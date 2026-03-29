import { useState, useEffect } from 'react';

interface TypewriterMessageProps {
  text: string;
  animate: boolean;
  onType?: () => void;
  speed?: number; // ms per character
}

export default function TypewriterMessage({ text, animate, onType, speed = 15 }: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const [isTyping, setIsTyping] = useState(animate);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    const chars = Array.from(text);
    const displayedChars = Array.from(displayedText);

    if (displayedChars.length < chars.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(chars.slice(0, displayedChars.length + 1).join(''));
        if (onType) {
          // Вызываем onType только периодически, чтобы не перегружать рендеринг и скролл
          if (displayedChars.length % 5 === 0) {
            onType();
          }
        }
      }, speed);
      return () => clearTimeout(timeoutId);
    } else {
      setIsTyping(false);
      if (onType) onType(); // Финальный скролл
    }
  }, [displayedText, text, animate, speed, onType]);

  return (
    <>
      {displayedText}
      {isTyping && <span className="typing-cursor">▋</span>}
    </>
  );
}
