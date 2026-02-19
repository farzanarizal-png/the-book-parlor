import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf6e9] flex flex-col items-center justify-center p-8 font-serif">
      {/* Logo Section */}
      <div className="mb-6">
        <img src="logo.png" alt="The Book Parlor" className="w-64 md:w-80 h-auto" />
      </div>

      {/* Title & Subtitle */}
      <h1 className="text-4xl md:text-5xl font-bold text-[#333] mb-2 text-center">
        Swap Stories, Share Adventures
      </h1>
      <p className="text-xl italic text-gray-600 mb-10 text-center">
        Your cozy community for book lovers
      </p>

      {/* Main Illustration */}
      <div className="mb-10 w-full max-w-md">
        <img src="bookswap.png" alt="Book Swap" className="w-full h-auto" />
      </div>

      {/* Navigation Button */}
      <button
        onClick={() => navigate('/login')}
        className="bg-[#9db490] hover:bg-[#8a9f7e] text-white px-12 py-4 rounded-full text-lg font-medium shadow-md transition-all duration-300"
      >
        Enter the Library
      </button>
    </div>
  );
}

export default LandingPage;
