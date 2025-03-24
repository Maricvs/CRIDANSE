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
      { id: 1, name: 'Библиотека МГУ', description: 'Документы для студентов МГУ' },
      { id: 2, name: 'Библиотека СПбГУ', description: 'Документы для студентов СПбГУ' },
      { id: 3, name: 'Библиотека ВШЭ', description: 'Документы для студентов ВШЭ' },
    ];
    setLibraries(librariesData);
  };

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    loadLibraries();
  }, []);

  return (
    <div className="libraries-container">
      <h2>Библиотеки документов</h2>
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
