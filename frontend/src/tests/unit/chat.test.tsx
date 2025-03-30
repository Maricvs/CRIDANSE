import { render, fireEvent, screen } from '@testing-library/react';
import Chat from '../../components/Chat';
import { BrowserRouter } from 'react-router-dom';

describe('Chat Component', () => {
  const renderChat = () => {
    return render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
  };

  test('отображение чата', () => {
    const { container } = renderChat();
    // Здесь будут ваши тесты
  });
}); 