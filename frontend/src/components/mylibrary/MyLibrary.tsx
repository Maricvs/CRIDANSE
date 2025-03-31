import React, { useState } from 'react';
import DocumentList from './pages/DocumentList';
import UploadModal from './components/UploadModal';
import './MyLibrary.css';

const MyLibrary: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  return (
    <div className="my-library">
      <div className="nav-bar">
        <button className="upload-button" onClick={handleUpload}>
          Загрузить
        </button>
      </div>
      <DocumentList />
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
};

export default MyLibrary; 