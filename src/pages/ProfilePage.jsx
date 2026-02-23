import React, { useState, useEffect } from 'react';   
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookshelf');

  // --- FIREBASE STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: 'Reader',
    username: '@booklover',
    location: 'Unknown Location',
    rating: '0.0 / 5',
    profileImage: null 
  });
  const [myBooks, setMyBooks] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // --- FETCH USER DATA, BOOKS, SWAPS & REVIEWS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch User Profile Data
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let fetchedName = "Reader";
          let fetchedUsername = `@reader${user.uid.substring(0, 4)}`;
          let fetchedLocation = "Update your location";
          let fetchedProfileImage = null; 

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            fetchedName = data.name || data.displayName || "Reader";
            fetchedUsername = data.username || `@${fetchedName.toLowerCase().replace(/\s/g, '')}`;
            fetchedLocation = data.location || "Location not set";
            fetchedProfileImage = data.profileImageUrl || data.profileImage || null;
          } else if (user.displayName) {
            fetchedName = user.displayName;
          } else if (user.email) {
            fetchedName = user.email.split('@')[0];
          }

          // 2. Fetch User's Bookshelf
          const booksRef = collection(db, 'books');
          const qBooks = query(booksRef, where("ownerId", "==", user.uid));
          const querySnapshot = await getDocs(qBooks);
          const booksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyBooks(booksData);

          // 3. Fetch Swaps & Reviews (from the 'ratings' collection ledger)
          const ratingsRef = collection(db, 'ratings');
          
          // Get swaps where user initiated (they met up) or received (partner met up)
          const qSwapsInitiated = query(ratingsRef, where("reviewerId", "==", user.uid));
          const qSwapsReceived = query(ratingsRef, where("revieweeId", "==", user.uid));
          
          const [swapsInitSnap, swapsRecSnap] = await Promise.all([
            getDocs(qSwapsInitiated), 
            getDocs(qSwapsReceived)
          ]);
          
          const swapsInitData = swapsInitSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'initiator' }));
          const swapsRecData = swapsRecSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'receiver' }));
          
          // Combine and sort by date descending
          const allSwaps = [...swapsInitData, ...swapsRecData].sort((a, b) => {
            const timeA = a.completedAt?.toMillis() || a.createdAt?.toMillis() || 0;
            const timeB = b.completedAt?.toMillis() || b.createdAt?.toMillis() || 0;
            return timeB - timeA;
          });
          setMySwaps(allSwaps);

          // 4. Extract Completed Reviews (where user is the reviewee)
          const completedReviews = swapsRecData.filter(swap => swap.status === 'completed' && swap.rating > 0);
          setMyReviews(completedReviews);

          // Calculate Average Rating dynamically
          let avgRating = '0.0 / 5';
          if (completedReviews.length > 0) {
            const sum = completedReviews.reduce((acc, curr) => acc + curr.rating, 0);
            avgRating = (sum / completedReviews.length).toFixed(1) + ' / 5';
          }

          // Update Profile State
          setUserProfile({
            name: fetchedName,
            username: fetchedUsername,
            location: fetchedLocation,
            rating: avgRating, 
            profileImage: fetchedProfileImage 
          });

        } catch (error) {
          console.error("Error fetching profile data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // --- Full Sidebar Navigation ---
  const handleNavigation = (item) => {
    if (item === 'Home') navigate('/home');
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Chat') navigate('/chat');
    if (item === 'Rating') navigate('/rating');
    if (item === 'Profile') {}
  };

  // --- BOOK ACTIONS (EDIT & DELETE) ---
  const handleEditBook = (e, bookId) => {
    e.stopPropagation(); // Prevents the card's main onClick from firing
    navigate(`/edit-book/${bookId}`);
  };

  const handleDeleteBook = async (e, bookId) => {
    e.stopPropagation(); // Prevents the card's main onClick from firing
    
    const confirmDelete = window.confirm("Are you sure you want to delete this book from your shelf?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'books', bookId));
        // Remove book from local state immediately for snappy UI
        setMyBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
      } catch (error) {
        console.error("Error deleting book:", error);
        alert("Failed to delete the book. Please try again.");
      }
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#faf6e9] font-serif text-2xl">Loading Profile...</div>;
  }

  const getInitials = (name) => {
    const names = name.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
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
          {[
            { id: 'Profile', label: 'Profile' },
            { id: 'Home', label: 'Home' },
            { id: 'Add a New Book', label: 'Add a New Book' },
            { id: 'Chat', label: 'Chat' },
            { id: 'Rating', label: 'Rating' }
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`py-4 text-xl cursor-pointer transition-colors ${
                item.id === 'Profile' 
                  ? 'text-gray-900 font-bold bg-[#cddce6]' 
                  : 'text-gray-700 hover:bg-white/20 hover:text-gray-900'
              }`}
            >
              {item.label}
            </div>
          ))}
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-10 md:px-20 py-12 relative h-full">
        
        {/* --- PROFILE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          
          <div className="flex items-center space-x-6">
            
            <div className="w-28 h-28 rounded-full bg-[#f97316] text-white flex items-center justify-center font-sans font-bold text-4xl shadow-md border-4 border-[#faf6e9] uppercase overflow-hidden">
              {userProfile.profileImage ? (
                <img src={userProfile.profileImage} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(userProfile.name)
              )}
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold text-gray-800 mb-1 capitalize">{userProfile.name}</h1>
              <p className="text-gray-500 font-sans text-sm mb-2">{userProfile.username}</p>
              
              <div className="flex items-center text-gray-600 text-sm font-sans mb-1">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {userProfile.location}
              </div>
              
              <div className="flex items-center text-sm font-sans text-gray-500 mt-1">
                <div className="flex text-gray-300 mr-2">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={star <= Math.round(parseFloat(userProfile.rating)) ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <span>{myReviews.length > 0 ? `${myReviews.length} reviews` : 'No ratings yet'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/edit-profile')}
            className="mt-6 md:mt-0 bg-[#d4dfc7] hover:bg-[#c2d1b0] text-[#3a4a27] font-bold py-2 px-6 rounded-full text-sm font-sans transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="flex justify-around items-center border-y border-gray-300 py-8 mb-10">
          <div className="text-center">
            <span className="block text-3xl font-sans font-medium text-gray-800">{mySwaps.length}</span>
            <span className="text-gray-600 text-lg">Swaps</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-sans font-medium text-gray-800">{myBooks.length}</span>
            <span className="text-gray-600 text-lg">Books</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-sans font-medium text-gray-800">{userProfile.rating}</span>
            <span className="text-gray-600 text-lg">Rating</span>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex justify-around border-b border-gray-200 mb-8 flex-wrap gap-4">
          {[
            { id: 'bookshelf', label: 'My Bookshelf' },
            { id: 'swaps', label: 'Swaps History' },
            { id: 'reviews', label: 'Reviews' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xl transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-gray-900 font-bold border-b-2 border-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'reviews' && myReviews.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs font-sans px-2 py-0.5 rounded-full absolute -top-1 -right-4">
                  {myReviews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT --- */}
        <div className="w-full">
          
          {/* BOOKSHELF TAB */}
          {activeTab === 'bookshelf' && (
            <div>
              {myBooks.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Your shelf is currently empty</h3>
                  <p className="text-gray-500 font-sans mb-6">Add your first book to start your trading journey!</p>
                  <button 
                    onClick={() => navigate('/add-book')}
                    className="bg-[#5a7034] hover:bg-[#465728] text-white font-sans font-bold px-8 py-3 rounded-full transition-all shadow-md transform hover:scale-105"
                  >
                    + Add a New Book
                  </button>
                </div>
              ) : (
                // Populated Bookshelf
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-10">
                  {myBooks.map((book) => (
                    <div 
                      key={book.id} 
                      onClick={() => navigate(`/book/${book.id}`)} 
                      className="flex flex-col items-center group cursor-pointer relative"
                    >
                      <div className="w-full aspect-2/3 max-w-140px bg-[#cad3c3] relative flex items-center justify-center rounded-md shadow-md mb-4 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl overflow-hidden border border-gray-200 text-center px-2">
                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full font-sans font-bold text-[8px] uppercase tracking-widest shadow-md z-10 ${
                          book.status === 'Available' ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'
                        }`}>
                          {book.status || 'Available'}
                        </div>
                        
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0 z-0" />
                        ) : (
                          <span className="text-gray-600 text-sm font-sans font-medium leading-snug z-10">{book.title}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-center leading-tight mb-1 text-sm w-full truncate px-2">{book.title}</h3>
                      <p className="text-gray-500 text-xs text-center w-full truncate px-2 mb-2">{book.author}</p>

                      {/* Action Buttons (Visible on Hover) */}
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                        <button
                          onClick={(e) => handleEditBook(e, book.id)}
                          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-sans font-bold py-1 px-3 rounded-full transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteBook(e, book.id)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-sans font-bold py-1 px-3 rounded-full transition-colors"
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SWAPS TAB */}
          {activeTab === 'swaps' && (
            <div>
              {mySwaps.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No swaps yet</h3>
                  <p className="text-gray-500 font-sans text-center">Your swap history will appear here once you make your first trade.</p>
                </div>
              ) : (
                // Populated Swaps List
                <div className="space-y-4 max-w-3xl mx-auto pb-10 animate-in fade-in duration-500">
                  {mySwaps.map((swap) => {
                    const swapDate = swap.completedAt?.toDate() || swap.createdAt?.toDate() || new Date();
                    const isCompleted = swap.status === 'completed';
                    return (
                      <div key={swap.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#dde5eb] rounded-full flex items-center justify-center text-xl font-bold text-gray-700 shrink-0">
                            🤝
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">
                              Swap with {swap.role === 'initiator' ? swap.partnerName : "a Fellow Reader"}
                            </h3>
                            <p className="text-gray-500 font-sans text-sm">{swapDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-sans uppercase tracking-widest shrink-0 ${
                          isCompleted ? 'bg-[#5d782b]/10 text-[#5d782b]' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {isCompleted ? 'Completed' : 'Pending Review'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div>
              {myReviews.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No reviews yet</h3>
                  <p className="text-gray-500 font-sans text-center">Complete a swap to start earning ratings from the community.</p>
                </div>
              ) : (
                // Populated Reviews List
                <div className="space-y-4 max-w-3xl mx-auto pb-10 animate-in fade-in duration-500">
                  {myReviews.map((review) => {
                    const reviewDate = review.completedAt?.toDate() || new Date();
                    return (
                      <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 font-sans uppercase tracking-wider">
                            {reviewDate.toLocaleDateString()}
                          </p>
                        </div>
                        {review.reviewText && (
                          <p className="text-gray-700 italic font-sans border-l-4 border-[#cddce6] pl-3 py-1">
                            "{review.reviewText}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

export default ProfilePage;