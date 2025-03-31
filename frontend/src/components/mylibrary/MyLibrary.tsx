import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DocumentList from './pages/DocumentList';
import DocumentUpload from './pages/DocumentUpload';
import './MyLibrary.css';

const MyLibrary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/mylibrary';

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <div className="nav-bar">
        <button className="back-button" onClick={handleBack}>Назад</button>
      </div>
      <div className="my-library">
        <h1>Моя Библиотека</h1>
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/upload" element={<DocumentUpload />} />
        </Routes>
      </div>
    </div>
  );
};

export default MyLibrary; 