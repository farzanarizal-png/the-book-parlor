import React, { useState } from 'react';   
import { useNavigate } from 'react-router-dom';

// New User: Empty Bookshelf
const myBookshelf = [];

// UPDATED: Added ownerRating and standardized status to match BookDetailsPage
const recommendedBooks = [
  { 
    id: 5, 
    title: "The Silent Patient", 
    author: "Alex Michaelides", 
    location: "Kuala Lumpur", 
    owner: "Sarah", 
    ownerAvatar: "SA", 
    ownerRating: 4.8,
    status: "Available", 
    condition: "Like New",
    genre: "Mystery/Thriller",
    description: "Alicia Berenson’s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London’s most desirable areas. One evening her husband returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word." 
  },
  { 
    id: 6, 
    title: "Dune", 
    author: "Frank Herbert", 
    location: "Selangor", 
    owner: "Ahmad", 
    ownerAvatar: "AH",
    ownerRating: 4.2,
    status: "Reserved", // Changed from "Pending Swap" to match logic
    condition: "Good / Lightly Read",
    genre: "Sci-Fi",
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange, a drug capable of extending life and enhancing consciousness." 
  },
  { 
    id: 7, 
    title: "Atomic Habits", 
    author: "James Clear", 
    location: "Penang", 
    owner: "Lee", 
    ownerAvatar: "LE",
    ownerRating: 5.0,
    status: "Available", 
    condition: "Brand New",
    genre: "Self-Help",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results." 
  },
  { 
    id: 8, 
    title: "1984", 
    author: "George Orwell", 
    location: "Kuala Lumpur", 
    owner: "Hayden", 
    ownerAvatar: "HA",
    ownerRating: 4.5,
    status: "Available", 
    condition: "Acceptable / Heavily Read",
    genre: "Classic / Dystopian",
    description: "Winston Smith toes the Party line, rewriting history to satisfy the Ministry of Truth. With every lie he writes, Winston grows to hate the Party that seeks power for its own sake and persecutes those who dare to commit thoughtcrime. But as he begins to think for himself, Winston can’t escape the fact that Big Brother is always watching." 
  },
];

function HomePage() {
  const navigate = useNavigate();

  // UI States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // --- NEW: Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification State
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to The Book Parlor! Claim your first spot on the shelf.", time: "Just now", unread: true },
    { id: 2, text: "Explore recommended books in your area.", time: "2 mins ago", unread: true }
  ]);

  const hasUnread = notifications.some(n => n.unread);

  // --- Handlers ---
  const handleSignOut = () => {
    navigate('/login');
  };

  const toggleNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
    setIsDropdownOpen(false); 
    setIsFilterOpen(false);   
    
    // Mark as read when closing
    if (!isNotifOpen) {
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
    }
  };

  const toggleProfileDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotifOpen(false);  
    setIsFilterOpen(false); 
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    setIsNotifOpen(false);     
    setIsDropdownOpen(false);  
  };

  // --- Navigation Handler ---
  const handleNavigation = (item) => {
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
    if (item === 'Home') { /* Do nothing, already on Home */ }
    if (item === 'Rating') navigate('/rating');
  };

  // --- NEW: Filter books based on search query ---
  const filteredRecommendedBooks = recommendedBooks.filter((book) => {
    if (!searchQuery) return true; // If search is empty, show all
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(lowerCaseQuery) ||
      book.author.toLowerCase().includes(lowerCaseQuery) ||
      book.genre.toLowerCase().includes(lowerCaseQuery)
    );
  });

  return (
    <div className="flex h-screen bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg">
        <div className="bg-[#faf6e9] rounded-2xl p-4 mb-10 w-4/5 shadow-sm flex justify-center cursor-pointer transition-transform hover:scale-105">
          <img src="logo.png" alt="The Book Parlor" className="w-full h-auto" />
        </div>

        <nav className="flex flex-col w-full text-center space-y-2 mt-4">
          {['Profile', 'Home', 'Add a New Book', 'Chat', 'Rating'].map((item) => (
            <div 
              key={item}
              onClick={() => handleNavigation(item)} 
              className={`py-4 text-xl cursor-pointer transition-colors ${
                item === 'Home' 
                  ? 'text-gray-900 font-bold bg-[#cddce6]' 
                  : 'text-gray-700 hover:bg-white/20 hover:text-gray-900'
              }`}
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative h-full bg-[#faf6e9]">
        
        {/* --- HEADER SECTION --- */}
        <div className="px-10 pt-10 pb-6 z-30 bg-[#dde5eb]">
          <h1 className="text-5xl italic font-bold text-gray-800 mb-2 drop-shadow-sm">
            Welcome, Hayden !
          </h1>
          <p className="text-2xl text-gray-600 mb-8">Ready to Trade?</p>

          <div className="flex items-center justify-between relative">
            
            {/* Search Bar Container */}
            <div className="relative flex items-center bg-[#faf6e9] border border-gray-300 rounded-full w-[60%] px-4 py-2 focus-within:border-gray-500 transition-all shadow-sm">
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/* --- UPDATED: Search Input bound to state --- */}
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Books by title, author, or genre..." 
                className="bg-transparent border-none outline-none text-lg w-full text-gray-700 placeholder-gray-400 font-sans"
              />
              
              <svg 
                onClick={toggleFilter}
                className={`w-6 h-6 ml-3 cursor-pointer transition-colors ${isFilterOpen ? 'text-[#5d782b]' : 'text-gray-400 hover:text-gray-700'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>

              {/* FILTER DROPDOWN */}
              {isFilterOpen && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden font-sans p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-800 text-lg">Filter Search</h3>
                    <button onClick={toggleFilter} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                    <select className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all cursor-pointer">
                      <option>All Locations</option>
                      <option>Kuala Lumpur</option>
                      <option>Selangor</option>
                      <option>Penang</option>
                      <option>Perak</option>
                      <option>Kedah</option>
                      <option>Kelantan</option>
                      <option>Pahang</option>
                      <option>Terengganu</option>
                      <option>Perlis</option>
                      <option>Melaka</option>  
                      <option>Negeri Sembilan</option>
                      <option>Johor</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Genre</label>
                    <select className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all cursor-pointer">
                      <option>All Genres</option>
                      <option>Fiction</option>
                      <option>Non-Fiction</option>
                      <option>Mystery / Thriller</option>
                      <option>Sci-Fi / Fantasy</option>
                      <option>Romance</option>
                    </select>
                  </div>

                  <button 
                    onClick={toggleFilter}
                    className="w-full bg-[#5d782b] hover:bg-[#4a6023] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm transform hover:scale-[1.02]"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            {/* Profile & Notifications Container */}
            <div className="flex items-center space-x-6 text-gray-400 relative">
              
              {/* NOTIFICATIONS */}
              <div className="relative">
                <div onClick={toggleNotifications} className="relative cursor-pointer group p-1">
                  <svg className={`w-7 h-7 transition-colors ${isNotifOpen ? 'text-gray-700' : 'group-hover:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  {hasUnread && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#dde5eb]"></span>
                  )}
                </div>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/40 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">New</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-5 text-center text-gray-500 text-sm">You're all caught up!</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3">
                            <div className="mt-1">
                              <div className={`w-2 h-2 rounded-full ${n.unread ? 'bg-blue-500' : 'bg-gray-300'} opacity-80`}></div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-800 leading-snug">{n.text}</p>
                              <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FUNCTIONAL CHAT ICON */}
              <svg 
                onClick={() => navigate('/chat')}
                className="w-7 h-7 cursor-pointer hover:text-gray-600 transition-colors" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              
              {/* PROFILE DROPDOWN */}
              <div className="relative">
                <div className="flex items-center space-x-2 cursor-pointer ml-4 group" onClick={toggleProfileDropdown}>
                  <div className="w-10 h-10 rounded-full bg-[#f97316] text-white flex items-center justify-center font-sans font-bold text-sm shadow-sm">
                    HA
                  </div>
                  <span className="text-xl text-gray-800">Hayden</span>
                  <svg className={`w-5 h-5 text-gray-800 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-4 w-48 bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      <button 
                        onClick={() => navigate('/profile')}
                        className="w-full text-left px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-serif transition-colors border-l-4 border-transparent hover:border-gray-500"
                      >
                        My Profile
                      </button>
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-5 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 font-serif transition-colors border-l-4 border-transparent hover:border-red-500"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-10 pt-6 pb-32 hide-scrollbar z-10 bg-[#faf6e9]">
          
          {/* --- MY BOOKSHELF (NEW USER EMPTY STATE) --- */}
          <div className="bg-[#a3b19b] rounded-t-2rem p-8 pb-10 shadow-inner min-h-300px">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">My Bookshelf</h2>
              <button className="bg-[#5a7034] hover:bg-[#465728] text-white px-6 py-2 rounded-full text-lg transition-colors shadow-md">
                See All {'>'}
              </button>
            </div>

            {myBookshelf.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-white/20 rounded-xl border-2 border-dashed border-white/50 shadow-sm">
                <p className="text-xl italic text-gray-800 mb-2 font-semibold">Your shelf is looking a little bare!</p>
                <p className="text-gray-700 mb-5 font-sans text-sm">Add your first book to start trading with the community.</p>
                <button 
                  onClick={() => navigate('/add-book')} 
                  className="bg-[#faf6e9] text-[#5a7034] font-bold px-8 py-2.5 rounded-full hover:bg-white transition-all shadow-md transform hover:scale-105 font-sans"
                >
                  + Add Book
                </button>
              </div>
            ) : (
              <div className="flex space-x-8 overflow-x-auto pb-6 hide-scrollbar">
                {/* Book items go here */}
              </div>
            )}
          </div>

          {/* --- RECOMMENDED SECTION --- */}
          <div className="bg-[#a3b19b] p-8 pb-12 shadow-inner mt-2px">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Recommended</h2>
            
            <div className="flex space-x-8 overflow-x-auto pb-6 hide-scrollbar">
              {/* --- UPDATED: Map over filteredRecommendedBooks instead of recommendedBooks --- */}
              {filteredRecommendedBooks.length > 0 ? (
                filteredRecommendedBooks.map((book) => (
                  <div 
                    key={book.id} 
                    onClick={() => navigate(`/book/${book.id}`)} 
                    className="flex flex-col items-center min-w-140px group cursor-pointer relative"
                  >
                    {/* Book Cover Visual with Status Badge */}
                    <div className="w-32 h-48 bg-[#cad3c3] relative flex items-center justify-center rounded-md shadow-md mb-4 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl overflow-hidden border border-white/20 text-center px-2">
                      
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full font-sans font-bold text-[8px] uppercase tracking-widest shadow-md ${
                        book.status === 'Available' ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {book.status}
                      </div>

                      <span className="text-gray-600 text-sm font-sans font-medium leading-snug">{book.title}</span>
                    </div>

                    {/* Book Information */}
                    <h3 className="font-bold text-gray-900 text-center leading-tight mb-1 text-sm">{book.title}</h3>
                    <p className="text-gray-700 text-xs text-center">{book.author}</p>
                    
                    {/* Owner with Rating Stars */}
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <p className="text-gray-800 text-xs text-center font-bold">Owner: {book.owner}</p>
                      <div className="flex items-center">
                        <svg className="w-2.5 h-2.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#5d782b] ml-0.5">{book.ownerRating}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-[10px] italic text-center mt-0.5">{book.location}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-800 italic w-full text-center mt-4">No books found matching "{searchQuery}"</p>
              )}
            </div>
          </div>

        </div>

        {/* --- CUSTOM FAB (Add a New Book) --- */}
        <div 
          onClick={() => navigate('/add-book')} 
          className="absolute bottom-8 right-8 flex flex-col items-center justify-center w-36 h-36 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl cursor-pointer hover:scale-105 hover:bg-white transition-all z-50 border border-white group"
        >
          <div className="relative mb-1 flex justify-center items-center">
            <svg width="60" height="40" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform">
              <path d="M28 6C28 6 20 0 10 0C4 0 2 6 2 6V42C2 42 6 38 12 38C20 38 28 44 28 44V6Z" fill="#7a8b99"/>
              <path d="M32 6C32 6 40 0 50 0C56 0 58 6 58 6V42C58 42 54 38 48 38C40 38 32 44 32 44V6Z" fill="#7a8b99"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a8b99" strokeWidth="4" strokeLinecap="round">
                  <line x1="12" y1="3" x2="12" y2="21"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center font-serif text-[14px] leading-tight text-gray-800 font-medium mt-1">
            Add a New<br/>Book
          </div>
        </div>

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
    </div>
  );
}

export default HomePage;