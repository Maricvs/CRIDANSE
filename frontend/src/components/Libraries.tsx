// src/components/Libraries.tsx

import React, { useState, useEffect } from 'react';
import '../Libraries.css'

// Тип для библиотеки документов
interface Library {
  id: number;
  name: string;
  description: string;
}

const Libraries: React.FC = () => {
  // Хук для хранения списка библиотек
  const [libraries, setLibraries] = useState<Library[]>([]);

  // Функция для загрузки данных (можно будет заменить на API запрос)
  const loadLibraries = () => {
    const librariesData: Library[] = [
      { id: 1, name: 'MSU Library', description: 'Documents for MSU students' },
      { id: 2, name: 'SPbSU Library', description: 'Documents for SPbSU students' },
      { id: 3, name: 'HSE Library', description: 'Documents for HSE students' },
    ];
    setLibraries(librariesData);
  };

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    loadLibraries();
  }, []);

  return (
    <div className="libraries-container">
      <h2>Document Libraries</h2>
      <ul>
        {libraries.map((library) => (
          <li key={library.id}>
            <h3>{library.name}</h3>
            <p>{library.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Libraries;
