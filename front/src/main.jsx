import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './workspace/LoginPage.jsx';
import Workspace from './workspace/Workspace.jsx';
import { getToken } from './api.js';
import './styles.css';

function EntryRedirect() {
  const hasSession = Boolean(getToken());
  return <Navigate to={hasSession ? '/app' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/*" element={<Workspace />} />
        <Route path="/guest/*" element={<Workspace />} />
        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
