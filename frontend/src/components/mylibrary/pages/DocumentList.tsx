import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaUpload, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt } from 'react-icons/fa';
import '../MyLibrary.css';

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

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/documents/list/user/${userId}`);
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

  const handleDocumentClick = (documentId: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.delete-button')) {
      return;
    }
    navigate(`/document/${documentId}`);
  };

  const handleDeleteDocument = async (documentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Обновляем список документов после успешного удаления
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleUploadClick = () => {
    navigate('/mylibrary/upload');
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <FaFilePdf />;
    }
    if (type.includes('doc') || type.includes('word')) {
      return <FaFileWord />;
    }
    if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) {
      return <FaFileExcel />;
    }
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) {
      return <FaFileImage />;
    }
    if (type.includes('txt') || type.includes('text')) {
      return <FaFileAlt />;
    }
    return <FaFile />;
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <div className="documents-header">
        <h2>Мои документы</h2>
      </div>
      <div className="documents-grid">
        {/* Поле для загрузки файла */}
        <div className="document-card upload-card" onClick={handleUploadClick}>
          <div className="upload-placeholder">
            <div className="icon">
              <FaUpload />
            </div>
            <p>Загрузить новый документ</p>
          </div>
        </div>

        {/* Список документов */}
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="document-card"
            onClick={(e) => handleDocumentClick(doc.id, e)}
          >
            <div className="document-card-header">
              <div className="file-icon">
                {getFileIcon(doc.file_type)}
              </div>
              <h3>{doc.title}</h3>
              <button 
                className="delete-button"
                onClick={(e) => handleDeleteDocument(doc.id, e)}
                title="Удалить документ"
              >
                <FaTrash />
              </button>
            </div>
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
  );
};

export default DocumentList;