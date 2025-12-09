import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AngleQuiz from './apps/AngleQuiz';

function App() {
  return (
    <BrowserRouter basename="/maths">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/angle-quiz" element={<AngleQuiz />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
