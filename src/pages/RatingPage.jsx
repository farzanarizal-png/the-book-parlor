import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

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

  // --- UI & AUTH STATES ---
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'received'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Interactive Star States (Updated to handle multiple pending reviews smoothly)
  const [hoveredStars, setHoveredStars] = useState({}); 
  const [selectedStars, setSelectedStars] = useState({}); 
  const [reviewTexts, setReviewTexts] = useState({});      

  // --- FIREBASE DATA STATES ---
  const [pendingRatings, setPendingRatings] = useState([]); 
  const [receivedRatings, setReceivedRatings] = useState([]);
  const [averageRating, setAverageRating] = useState("0.0");

  // 1. LISTEN FOR LOGGED-IN USER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH REAL-TIME RATINGS FROM FIREBASE
  useEffect(() => {
    if (!currentUser) return;

    // A. Listen for pending reviews THIS user needs to give
    const qPending = query(
      collection(db, 'ratings'), 
      where('reviewerId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingRatings(pending);
    });

    // B. Listen for completed reviews THIS user has received
    const qReceived = query(
      collection(db, 'ratings'), 
      where('revieweeId', '==', currentUser.uid),
      where('status', '==', 'completed')
    );

    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      const received = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReceivedRatings(received);

      // C. Calculate Average Rating Dynamically
      if (received.length > 0) {
        const totalStars = received.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating((totalStars / received.length).toFixed(1));
      } else {
        setAverageRating("0.0");
      }
    });

    return () => {
      unsubPending();
      unsubReceived();
    };
  }, [currentUser]);

  // --- HANDLERS ---
  const handleStarHover = (swapId, starValue) => {
    setHoveredStars(prev => ({ ...prev, [swapId]: starValue }));
  };

  const handleStarClick = (swapId, starValue) => {
    setSelectedStars(prev => ({ ...prev, [swapId]: starValue }));
  };

  const handleTextChange = (swapId, text) => {
    setReviewTexts(prev => ({ ...prev, [swapId]: text }));
  };

  // 3. PUSH REVIEW TO FIREBASE
  const handleSubmitReview = async (swapId, partnerName) => {
    const rating = selectedStars[swapId] || 0;
    const reviewText = reviewTexts[swapId] || "";

    if (rating === 0) {
      alert("Please select a star rating first!");
      return;
    }

    try {
      const ratingRef = doc(db, "ratings", swapId);
      await updateDoc(ratingRef, {
        rating: rating,
        reviewText: reviewText,
        status: 'completed',
        completedAt: serverTimestamp()
      });

      alert(`Thank you! Your ${rating}-star review for ${partnerName} has been submitted.`);
      
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Something went wrong saving your review.");
    }
  };

  return (
    <div className="flex h-screen bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg shrink-0">
        <div 
          onClick={() => navigate('/home')}
          className="bg-[#faf6e9] rounded-2xl p-4 mb-10 w-4/5 shadow-sm flex justify-center cursor-pointer transition-transform hover:scale-105"
        >
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

          {/* --- TAB CONTENT: PENDING RATINGS --- */}
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
                  <div key={swap.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Rate your swap with <span className="text-[#5d782b] italic">{swap.partnerName || "your partner"}</span>
                        </h3>
                        {swap.bookTitle && (
                          <p className="text-sm text-gray-500 font-sans mt-1">Book Traded: "{swap.bookTitle}"</p>
                        )}
                      </div>
                      
                      {/* Interactive Stars Component */}
                      <div className="flex gap-1" onMouseLeave={() => handleStarHover(swap.id, 0)}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const currentVal = hoveredStars[swap.id] || selectedStars[swap.id] || 0;
                          return (
                            <svg 
                              key={star} 
                              onMouseEnter={() => handleStarHover(swap.id, star)}
                              onClick={() => handleStarClick(swap.id, star)}
                              className={`w-8 h-8 cursor-pointer transition-colors ${star <= currentVal ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                    </div>

                    {/* Text Area */}
                    <textarea 
                      value={reviewTexts[swap.id] || ""}
                      onChange={(e) => handleTextChange(swap.id, e.target.value)}
                      placeholder="Leave a short review about your experience... (optional)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-sans text-sm focus:ring-2 focus:ring-[#5d782b] focus:border-transparent outline-none resize-none h-24 mb-4"
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleSubmitReview(swap.id, swap.partnerName || "your partner")}
                        className="bg-[#5d782b] text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-[#4a6023] transition-colors shadow-sm"
                      >
                        Submit Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- TAB CONTENT: MY REVIEWS --- */}
          {activeTab === 'received' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Overall Rating Banner */}
              <div className="bg-[#a3b19b] p-6 rounded-2xl shadow-inner mb-6 text-center text-white flex flex-col items-center">
                 <h2 className="text-3xl font-bold mb-1">Your Rating: {averageRating} / 5</h2>
                 <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-6 h-6 ${star <= Math.round(parseFloat(averageRating)) ? 'text-yellow-300' : 'text-white/40'} fill-current`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                 </div>
                 <p className="text-sm mt-3 opacity-90 font-sans font-medium">Based on {receivedRatings.length} reviews</p>
              </div>

              {/* Conditional Rendering: Empty State vs Populated State */}
              {receivedRatings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm mt-6">
                   <div className="flex justify-center mb-4">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  <p className="text-2xl italic text-gray-800 mb-2 font-bold">No reviews yet.</p>
                  <p className="text-gray-600 font-sans">When you receive reviews from other readers, they will appear here.</p>
                </div>
              ) : (
                receivedRatings.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                       <div className="flex space-x-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                       </div>
                       {review.reviewText && <p className="text-gray-700 italic font-sans mb-1">"{review.reviewText}"</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RatingPage;