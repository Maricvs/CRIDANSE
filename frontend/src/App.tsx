import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatField from './components/ChatField';
// import SuppChat from './components/SuppChat';
// import SubscrPackage from './components/SubscrPackage';
// import UserCollege from './components/UserCollege';
// import Documents from './components/Documents';
import Libraries from './components/Libraries
import Chat from './components/Chat';
import Auth from './components/Auth';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ChatField />} />
            <Route path="/chat/:id" element={<Chat />} /> {/* ← Добавлено это */}
            <Route path="/libraries" element={<Libraries />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
