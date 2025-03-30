import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
// import SuppChat from './components/SuppChat';
// import SubscrPackage from './components/SubscrPackage';
// import UserCollege from './components/UserCollege';
// import Documents from './components/Documents';
import Libraries from './components/Libraries';
import Auth from './components/Auth';
import MyLibrary from './components/mylibrary/MyLibrary';
import './App.css';
import Chat from './components/Chat'; // Импортируем Chat

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="app-layout">
        <Sidebar onCollapse={setIsSidebarCollapsed} />
        <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/" element={<Chat />} />
            <Route path="/libraries" element={<Libraries />} />
            <Route path="/mylibrary" element={<MyLibrary />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
