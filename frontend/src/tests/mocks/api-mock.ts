export const mockApi = {
  chat: {
    send: jest.fn(),
    getHistory: jest.fn(),
  },
  documents: {
    upload: jest.fn(),
    share: jest.fn(),
  },
  // ... другие методы API
}; 