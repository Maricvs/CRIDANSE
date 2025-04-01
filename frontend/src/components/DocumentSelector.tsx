import React, { useState, useEffect } from 'react';
import '../styles/DocumentSelector.css';

interface Document {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
}

interface DocumentSelectorProps {
  onDocumentsSelected: (documentIds: number[]) => void;
  selectedDocuments: number[];
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ 
  onDocumentsSelected, 
  selectedDocuments 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // Запрашиваем список документов для ИИ
        const response = await fetch(`/api/document_ai/processor/list_for_ai/${userId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить список документов');
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
        console.error('Ошибка при загрузке документов:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const toggleDocument = (documentId: number) => {
    const newSelectedDocs = selectedDocuments.includes(documentId)
      ? selectedDocuments.filter(id => id !== documentId)
      : [...selectedDocuments, documentId];
    
    onDocumentsSelected(newSelectedDocs);
  };

  if (loading) {
    return <div className="document-selector-loading">Загрузка документов...</div>;
  }

  if (error) {
    return <div className="document-selector-error">{error}</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="document-selector-empty">
        <p>У вас нет доступных документов.</p>
        <p>Загрузите документы в раздел "Моя библиотека".</p>
      </div>
    );
  }

  return (
    <div className="document-selector">
      <h3>Документы для использования:</h3>
      <div className="document-selector-list">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className={`document-selector-item ${selectedDocuments.includes(doc.id) ? 'selected' : ''}`}
            onClick={() => toggleDocument(doc.id)}
          >
            <div className="document-selector-checkbox">
              <input 
                type="checkbox" 
                checked={selectedDocuments.includes(doc.id)}
                onChange={() => toggleDocument(doc.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="document-selector-details">
              <div className="document-selector-title">{doc.title}</div>
              <div className="document-selector-info">
                {doc.file_name} ({doc.file_type})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentSelector; 