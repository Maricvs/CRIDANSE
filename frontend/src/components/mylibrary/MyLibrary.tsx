import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import DocumentList from './pages/DocumentList';
import DocumentUpload from './pages/DocumentUpload';
import './MyLibrary.css';

const MyLibrary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === '/mylibrary' || location.pathname === '/mylibrary/';

  const handleBack = () => {
    navigate(-1);
  };

  const handleUpload = () => {
    navigate('upload');
  };

  return (
    <div className="my-library">
      <div className="nav-bar">
        {!isRoot && (
          <button className="back-button" onClick={handleBack}>
            Назад
          </button>
        )}
        {isRoot && (
          <button className="upload-button" onClick={handleUpload}>
            Загрузить
          </button>
        )}
      </div>
      <Routes>
        <Route index element={<DocumentList />} />
        <Route path="upload" element={<DocumentUpload />} />
      </Routes>
    </div>
  );
};

export default MyLibrary; 