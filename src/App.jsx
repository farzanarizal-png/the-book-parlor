import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import AddBookPage from './pages/AddBookPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import BookDetailsPage from './pages/BookDetailsPage';
import ChatPage from './pages/ChatPage';
import RatingPage from './pages/RatingPage'; 
import EditBookPage from './pages/EditBookPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#faf6e9]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/add-book" element={<AddBookPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/book/:id" element={<BookDetailsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          
          {/* 2. ADD THE ROUTE HERE */}
          <Route path="/rating" element={<RatingPage />} /> 
          <Route path="/edit-book/:id" element={<EditBookPage />} /> 
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;