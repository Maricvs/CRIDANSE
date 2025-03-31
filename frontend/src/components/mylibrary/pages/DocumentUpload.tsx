import React, { useState } from 'react';
import '../MyLibrary.css';

interface UploadFormData {
  title: string;
  description: string;
  file: File | null;
}

const DocumentUpload: React.FC = () => {
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const userId = localStorage.getItem('user_id');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('file', formData.file);
    formDataToSend.append('user_id', userId || '');

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        file: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Загрузка документа</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Название</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Файл</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">Документ успешно загружен!</div>}

        <button type="submit" disabled={loading} className="upload-button">
          {loading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload; 