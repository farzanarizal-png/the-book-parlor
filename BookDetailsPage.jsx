import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Simulating the user's bookshelf (Currently empty for a new user)
const myBookshelf = []; 

// Updated book data including status and ownerRating
const bookData = {
  id: 5,
  title: "The Silent Patient",
  author: "Alex Michaelides",
  location: "Kuala Lumpur",
  genre: "Mystery / Thriller",
  owner: "SarahReads",
  condition: "Like New",
  status: "Available", // Added Status
  ownerRating: 4.8,    // Added Rating
  description: "Alicia Berenson’s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London’s most desirable areas. One evening her husband returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.",
};

function BookDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const handleNavigation = (item) => {
    if (item === 'Home') navigate('/home');
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
  };

  const handleRequestSwap = () => {
    setIsModalOpen(true);
  };

  const confirmSwap = () => {
    setSwapSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setSwapSuccess(false);
    }, 3000); 
  };

  return (
    <div className="flex h-screen bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg shrink-0">
        <div 
          onClick={() => navigate('/home')}
          className="bg-[#faf6e9] rounded-2xl p-4 mb-10 w-4/5 shadow-sm flex justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <img src="/logo.png" alt="The Book Parlor" className="w-full h-auto" />
        </div>

        <nav className="flex flex-col w-full text-center space-y-2 mt-4">
          {['Profile', 'Home', 'Add a New Book', 'Chat', 'Rating'].map((item) => (
            <div 
              key={item}
              onClick={() => handleNavigation(item)}
              className="py-4 text-xl cursor-pointer transition-colors text-gray-700 hover:bg-white/20 hover:text-gray-900"
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto relative h-full">
        
        {/* Back Button & Header */}
        <div className="px-10 pt-10 pb-6 bg-[#dde5eb] shadow-sm flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-gray-900 font-sans font-bold text-lg transition-colors"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Explore
          </button>
        </div>

        {/* Book Details Content */}
        <div className="px-10 md:px-20 py-12 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Book Cover with Status Badge */}
            <div className="md:w-1/3 bg-[#cad3c3] p-10 flex items-center justify-center min-h-400px relative">
              {/* STATUS BADGE */}
              <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest shadow-md ${
                bookData.status === 'Available' ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'
              }`}>
                {bookData.status}
              </div>

              <div className="w-48 h-72 bg-white rounded-md shadow-2xl flex items-center justify-center border border-gray-200 text-center px-4">
                <span className="text-gray-500 font-bold text-xl">{bookData.title}</span>
              </div>
            </div>

            {/* Right Column: Book Info */}
            <div className="md:w-2/3 p-10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-4xl font-bold text-gray-800">{bookData.title}</h1>
                  <span className="bg-[#e9ecef] text-gray-600 py-1 px-3 rounded-full text-xs font-sans font-bold tracking-wide uppercase">
                    {bookData.condition}
                  </span>
                </div>
                <p className="text-xl text-gray-600 italic mb-6">by {bookData.author}</p>
                
                <div className="flex space-x-4 mb-6 font-sans text-sm">
                  <span className="bg-[#f0f4eb] text-[#4a6023] py-1.5 px-4 rounded-lg font-semibold flex items-center">
                    📍 {bookData.location}
                  </span>
                  <span className="bg-blue-50 text-blue-700 py-1.5 px-4 rounded-lg font-semibold flex items-center">
                    📚 {bookData.genre}
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Synopsis</h3>
                  <p className="text-gray-600 font-sans leading-relaxed">
                    {bookData.description}
                  </p>
                </div>

                {/* OWNER DETAILS & RATING */}
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100 w-max mb-8">
                  <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-sans font-bold shadow-inner">
                    SR
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Owned By</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 font-sans">{bookData.owner}</p>
                      
                      {/* STAR RATING COMPONENT */}
                      <div className="flex items-center bg-[#5d782b]/10 px-1.5 py-0.5 rounded-md">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-bold text-[#5d782b] ml-1">{bookData.ownerRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON (Respects Status) */}
              <button 
                onClick={handleRequestSwap}
                disabled={bookData.status !== 'Available'}
                className={`w-full py-4 rounded-xl font-sans font-bold text-lg transition-transform shadow-md ${
                  bookData.status === 'Available' 
                  ? 'bg-[#5a7034] hover:bg-[#465728] text-white transform hover:scale-[1.02]' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                }`}
              >
                {bookData.status === 'Available' ? 'Request to Swap' : 'Currently Reserved'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- SWAP REQUEST MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            <div className="p-8 pb-4 text-center">
              {swapSuccess ? (
                <div className="py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Request Sent!</h2>
                  <p className="text-gray-600 font-sans">We've notified {bookData.owner}. Check your Chat soon!</p>
                </div>
              ) : myBookshelf.length === 0 ? (
                <div className="py-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Shelf is Empty!</h2>
                  <p className="text-gray-600 font-sans mb-6">You need to have at least one book to offer in exchange before you can send a swap request.</p>
                  
                  <div className="flex flex-col space-y-3">
                    <button 
                      onClick={() => navigate('/add-book')}
                      className="w-full bg-[#5a7034] hover:bg-[#465728] text-white py-3 rounded-xl font-sans font-bold transition-colors"
                    >
                      Add a Book Now
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-sans font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Offer a Book</h2>
                  <p className="text-gray-600 font-sans mb-6">Which book would you like to offer {bookData.owner} in exchange for <strong>{bookData.title}</strong>?</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Map through user's books here */}
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-sans font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmSwap}
                      className="flex-1 bg-[#5a7034] hover:bg-[#465728] text-white py-3 rounded-xl font-sans font-bold transition-colors"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookDetailsPage;