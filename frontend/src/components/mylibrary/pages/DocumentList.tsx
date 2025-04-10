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
  file_path: string;
  file_type: string;
  file_size: number;
  user_id: number;
  is_deleted: boolean;
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await fetch(`/api/documents/list/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.filter((doc: Document) => !doc.is_deleted));
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

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FaFilePdf />;
      case 'doc':
      case 'docx':
        return <FaFileWord />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage />;
      case 'txt':
        return <FaFileAlt />;
      default:
        return <FaFile />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="loading">Загрузка документов...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Мои документы</h2>
        <button className="upload-button" onClick={handleUploadClick}>
          <FaUpload /> Загрузить документ
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет документов</p>
          <button className="upload-button" onClick={handleUploadClick}>
            <FaUpload /> Загрузить первый документ
          </button>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="document-card"
              onClick={(e) => handleDocumentClick(doc.id, e)}
            >
              <div className="document-icon">
                {getFileIcon(doc.file_type)}
              </div>
              <div className="document-info">
                <h3>{doc.title}</h3>
                <p className="document-type">{doc.file_type.toUpperCase()}</p>
                <p className="document-size">{formatFileSize(doc.file_size)}</p>
                <p className="document-date">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="document-actions">
                <button
                  className="download-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDocument(doc.id, doc.title);
                  }}
                >
                  Скачать
                </button>
                <button
                  className="delete-button"
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;