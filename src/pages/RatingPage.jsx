import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RatingPage() {
  const navigate = useNavigate();

  // Navigation Handler
  const handleNavigation = (item) => {
    if (item === 'Home') navigate('/home');
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
    if (item === 'Rating') { /* Already here */ }
  };

  // --- UI States ---
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'received'
  
  // Interactive Star States (even though empty now, good to keep for when they get data)
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStars, setSelectedStars] = useState({}); 
  const [reviewTexts, setReviewTexts] = useState({});     

  // --- Mock Data (NEW USER: Empty State) ---
  const [pendingRatings, setPendingRatings] = useState([]); // No pending swaps to rate yet
  const receivedRatings = []; // No reviews received yet

  // --- Handlers ---
  const handleStarClick = (swapId, starValue) => {
    setSelectedStars(prev => ({ ...prev, [swapId]: starValue }));
  };

  const handleTextChange = (swapId, text) => {
    setReviewTexts(prev => ({ ...prev, [swapId]: text }));
  };

  const handleSubmitReview = (swapId, partnerName) => {
    const rating = selectedStars[swapId] || 0;
    if (rating === 0) {
      alert("Please select a star rating first!");
      return;
    }
    alert(`Thank you! Your ${rating}-star review for ${partnerName} has been submitted.`);
    setPendingRatings(prev => prev.filter(swap => swap.id !== swapId));
  };

  return (
    <div className="flex h-screen bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg shrink-0">
        <div 
          onClick={() => navigate('/home')}
          className="bg-[#faf6e9] rounded-2xl p-4 mb-10 w-4/5 shadow-sm flex justify-center cursor-pointer transition-transform hover:scale-105"
        >
          {/* ORIGINAL LOGO RESTORED */}
          <img src="logo.png" alt="The Book Parlor" className="w-full h-auto" />
        </div>

        <nav className="flex flex-col w-full text-center space-y-2 mt-4">
          {['Profile', 'Home', 'Add a New Book', 'Chat', 'Rating'].map((item) => (
            <div 
              key={item}
              onClick={() => handleNavigation(item)} 
              className={`py-4 text-xl cursor-pointer transition-colors ${
                item === 'Rating' 
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
      <div className="flex-1 flex flex-col relative h-full bg-[#faf6e9] overflow-y-auto hide-scrollbar">
        
        {/* --- HEADER SECTION --- */}
        <div className="px-10 pt-10 pb-6 bg-[#dde5eb] shrink-0 border-b border-gray-200">
          <h1 className="text-5xl italic font-bold text-gray-800 mb-2 drop-shadow-sm">
            Community Ratings
          </h1>
          <p className="text-xl text-gray-600 font-sans">
            Build trust. Share your swap experiences.
          </p>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="p-10 max-w-5xl mx-auto w-full">
          
          {/* Tabs */}
          <div className="flex space-x-6 mb-8 border-b-2 border-gray-200">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xl font-bold transition-colors relative ${
                activeTab === 'pending' ? 'text-[#5d782b]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              To Rate
              {pendingRatings.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs font-sans px-2 py-0.5 rounded-full">
                  {pendingRatings.length}
                </span>
              )}
              {activeTab === 'pending' && (
                <div className="absolute bottom-2px left-0 w-full h-1 bg-[#5d782b] rounded-t-md"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('received')}
              className={`pb-3 text-xl font-bold transition-colors relative ${
                activeTab === 'received' ? 'text-[#5d782b]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              My Reviews
              {activeTab === 'received' && (
                <div className="absolute bottom-2px left-0 w-full h-1 bg-[#5d782b] rounded-t-md"></div>
              )}
            </button>
          </div>

          {/* --- TAB CONTENT: PENDING RATINGS (NEW USER STATE) --- */}
          {activeTab === 'pending' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {pendingRatings.length === 0 ? (
                <div className="bg-[#a3b19b]/20 rounded-2xl p-12 text-center border-2 border-dashed border-[#a3b19b]/50">
                  <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-[#a3b19b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl italic text-gray-800 mb-2 font-bold">Nothing to rate right now.</p>
                  <p className="text-gray-600 font-sans">Once you successfully complete a book swap, you will be able to leave a rating and review for your partner here.</p>
                  <button 
                    onClick={() => navigate('/home')}
                    className="mt-6 bg-[#5d782b] hover:bg-[#4a6023] text-white px-8 py-2.5 rounded-full font-sans font-bold transition-all shadow-md transform hover:scale-105"
                  >
                    Explore Books
                  </button>
                </div>
              ) : (
                pendingRatings.map((swap) => (
                  /* Existing pending rating card logic (hidden for new users) */
                  <div key={swap.id}></div>
                ))
              )}
            </div>
          )}

          {/* --- TAB CONTENT: MY REVIEWS (NEW USER STATE) --- */}
          {activeTab === 'received' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Overall Rating Banner - Zero State */}
              <div className="bg-[#a3b19b] p-6 rounded-2xl shadow-inner mb-6 text-center text-white flex flex-col items-center">
                 <h2 className="text-3xl font-bold mb-1">Your Rating: 0.0 / 5</h2>
                 <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-6 h-6 text-white/40 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                 </div>
                 <p className="text-sm mt-3 opacity-90 font-sans font-medium">Based on 0 reviews</p>
              </div>

              {/* Empty state for received reviews */}
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm mt-6">
                 <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                <p className="text-2xl italic text-gray-800 mb-2 font-bold">No reviews yet!</p>
                <p className="text-gray-500 font-sans max-w-md mx-auto">
                  When you trade books with other members of The Book Parlor, their feedback and ratings will appear here.
                </p>
              </div>

            </div>
          )}

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

export default RatingPage;