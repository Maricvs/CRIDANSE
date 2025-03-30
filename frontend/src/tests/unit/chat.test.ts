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

  test('отправка сообщения', async () => {
    const { container } = renderChat();
    const mockMessage = 'Тестовое сообщение';

    // Находим поле ввода
    const input = screen.getByPlaceholderText('Введите сообщение...');
    expect(input).toBeInTheDocument();

    // Вводим сообщение
    fireEvent.change(input, { target: { value: mockMessage } });
    expect(input.value).toBe(mockMessage);

    // Находим кнопку отправки
    const sendButton = screen.getByRole('button', { name: /отправить/i });
    expect(sendButton).toBeInTheDocument();

    // Симулируем отправку
    fireEvent.click(sendButton);
  });

  test('получение ответа от сервера', async () => {
    const { container } = renderChat();
    const mockResponse = 'Ответ от сервера';

    // Мокаем fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: mockResponse })
    });

    // Проверяем, что ответ отображается
    const response = await screen.findByText(mockResponse);
    expect(response).toBeInTheDocument();
  });
}); 