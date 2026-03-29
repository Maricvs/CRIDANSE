import React, { useState } from 'react';
import '../MyLibrary.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadFormData {
  title: string;
  description: string;
  file: File | null;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
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
      setError('Please select a file');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title || formData.file.name);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('file', formData.file);
    formDataToSend.append('file_type', formData.file.type);
    formDataToSend.append('user_id', userId);

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
      
      // Закрываем модальное окно после успешной загрузки
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Document</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
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
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">File</label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Document uploaded successfully!</div>}

          <div className="modal-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal; 