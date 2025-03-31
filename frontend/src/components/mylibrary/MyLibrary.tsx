import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyLibrary.css';

interface Document {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  file_url: string;
  file_type: string;
  file_size: number;
  user_id: number;
}

const MyLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/documents/user/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const handleDocumentClick = (documentId: number) => {
    navigate(`/document/${documentId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div>
        <div className="nav-bar">
          <button className="back-button" onClick={handleBack}>Назад</button>
        </div>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="nav-bar">
          <button className="back-button" onClick={handleBack}>Назад</button>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="nav-bar">
        <button className="back-button" onClick={handleBack}>Назад</button>
      </div>
      <div className="my-library">
        <h1>Моя Библиотека</h1>
        <div className="documents-grid">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="document-card"
              onClick={() => handleDocumentClick(doc.id)}
            >
              <h3>{doc.title}</h3>
              <p>{doc.description}</p>
              <div className="document-meta">
                <span>Тип: {doc.file_type}</span>
                <span>Размер: {(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>Создан: {new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyLibrary; 