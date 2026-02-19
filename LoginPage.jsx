import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // A single generic profile so you can still test the login animation!
  const users = [
    { id: 1, name: "My Profile", image: "profile.png" },
  ];

  const handleBookClick = (user) => {
    setSelectedBook(user);
    setPassword('');
    setShowPassword(false);
  };

  const handleLogin = () => {
    alert(`Logged in as ${selectedBook.name}!`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* =========================================
          LEFT SIDE: Bookshelf Background & Books 
          ========================================= */}
      <div className="relative w-full md:w-1/2 h-full flex flex-col items-center bg-[#faf6e9]">
        
        {/* Bookshelf Background Image */}
        <img 
          src="bookshelf.png" 
          alt="3D Bookshelf Background" 
          className="absolute inset-0 w-full h-full object-cover z-0 object-center" 
        />

        {/* Overlay Text */}
        <h2 
          className="absolute top-[20%] md:top-[22%] z-10 text-white text-4xl md:text-5xl italic drop-shadow-md text-center px-4"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Pick Your Favourite Book
        </h2>

        {/* --- TOP ROW --- */}
        <div className="absolute top-[42%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          
          {/* The Single Profile Book */}
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleBookClick(user)}
              className={`w-20 h-32 md:w-24 md:h-36 bg-white rounded-sm cursor-pointer transition-all duration-300 transform shadow-lg overflow-hidden border-2 origin-bottom ${
                selectedBook?.id === user.id 
                  ? '-translate-y-4 border-[#9db490] ring-4 ring-[#9db490]/50 shadow-2xl scale-110' 
                  : 'border-transparent hover:-translate-y-2 hover:shadow-xl'
              }`}
              title={user.name}
            >
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'bg-[#c5d1bb]', 'text-xs', 'font-bold', 'text-center');
                  e.target.parentElement.innerText = user.name;
                }}
              />
            </div>
          ))}

          {/* 2 Empty Slots on Top Shelf */}
          {[2, 3].map((i) => (
            <div key={i} className="w-20 h-32 md:w-24 md:h-36 bg-[#f0f0f0] border-2 border-[#ccc] rounded-sm flex items-center justify-center opacity-80 cursor-not-allowed shadow-md">
              <span className="text-3xl text-gray-400">👤</span>
            </div>
          ))}
        </div>

        {/* --- BOTTOM ROW --- */}
        <div className="absolute top-[67%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          {/* 3 Empty Slots on Bottom Shelf */}
          {[4, 5, 6].map((i) => (
            <div key={i} className="w-20 h-32 md:w-24 md:h-36 bg-[#f0f0f0] border-2 border-[#ccc] rounded-sm flex items-center justify-center opacity-80 cursor-not-allowed shadow-md">
              <span className="text-3xl text-gray-400">👤</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: Login Form Area 
          ========================================= */}
      <div className="w-full md:w-1/2 h-full bg-[#a1af96] flex flex-col items-center justify-between py-12 px-6 md:px-12 text-white relative z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
        
        {/* Top: Logo */}
        <div className="mt-8 flex flex-col items-center w-full">
          <img src="logo.png" className="w-64 md:w-80 drop-shadow-md" alt="The Book Parlor" />
        </div>

        {/* Middle: Login Section */}
        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mt-20px">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 tracking-wide drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            Login
          </h1>

          <div className="w-full min-h-180px flex flex-col items-center transition-all duration-300">
            {selectedBook ? (
              <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                
                {/* --- Neatly Aligned Password Box --- */}
                <div className="w-full flex items-center bg-white/20 border-2 border-transparent focus-within:border-white focus-within:bg-white/30 rounded-full mb-4 overflow-hidden transition-all shadow-inner">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={`Password for ${selectedBook.name}`}
                    className="flex-1 py-3 pl-6 pr-2 bg-transparent text-white placeholder-white/70 focus:outline-none text-left text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="mr-2 px-4 py-1.5 text-sm font-bold text-white bg-[#5d782b]/70 hover:bg-[#5d782b] rounded-full transition-colors shadow-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                {/* Login Button */}
                <button 
                  onClick={handleLogin}
                  className="w-full py-3 mb-3 bg-[#5d782b] hover:bg-[#222] text-white rounded-full text-lg font-semibold shadow-md transition-colors"
                >
                  Login
                </button>

                {/* Forgot Password Link */}
                <a href="#" className="text-sm underline opacity-80 hover:opacity-100 hover:text-white transition-opacity">
                  Forgot password?
                </a>
              </div>
            ) : (
              <p className="text-white/80 italic text-lg mt-8 text-center px-4 leading-relaxed">
                Please pick your book from the shelf to log in.
              </p>
            )}
          </div>
        </div>

        {/* Bottom: Sign Up Section */}
        <div className="mb-6 flex flex-col items-center w-full max-w-[320px]">
          <p className="text-xl md:text-2xl mb-4 text-white drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            New here? Join the Parlor
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-[#5d782b] hover:bg-[#4a6023] text-white rounded-full text-lg font-semibold shadow-md transition-colors transform hover:scale-[1.02]"
          >
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;