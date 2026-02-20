import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebase'; // Adjust path if necessary
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
    rating: '--%',
    profileImage: null // ADDED: New state to hold the picture link!
  });
  const [myBooks, setMyBooks] = useState([]);

  // --- FETCH USER DATA & BOOKS ---
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
          let fetchedProfileImage = null; // ADDED: Variable to store the fetched image

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            fetchedName = data.name || data.displayName || "Reader";
            fetchedUsername = data.username || `@${fetchedName.toLowerCase().replace(/\s/g, '')}`;
            fetchedLocation = data.location || "Location not set";
            fetchedProfileImage = data.profileImage || null; // ADDED: Grab the ImgBB link from database!
          } else if (user.displayName) {
            fetchedName = user.displayName;
          } else if (user.email) {
            fetchedName = user.email.split('@')[0];
          }

          setUserProfile({
            name: fetchedName,
            username: fetchedUsername,
            location: fetchedLocation,
            rating: '--%', 
            profileImage: fetchedProfileImage // ADDED: Save it to our state!
          });

          // 2. Fetch User's Bookshelf
          const booksRef = collection(db, 'books');
          const q = query(booksRef, where("ownerId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const booksData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setMyBooks(booksData);

        } catch (error) {
          console.error("Error fetching profile data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Redirect if not logged in
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
    if (item === 'Profile') {
      // Already on Profile
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#faf6e9] font-serif text-2xl">Loading Profile...</div>;
  }

  // Generate initials for the avatar
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
          {['Profile', 'Home', 'Add a New Book', 'Chat', 'Rating'].map((item) => (
            <div 
              key={item}
              onClick={() => handleNavigation(item)}
              className={`py-4 text-xl cursor-pointer transition-colors ${
                item === 'Profile' 
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
      <div className="flex-1 overflow-y-auto hide-scrollbar px-10 md:px-20 py-12 relative h-full">
        
        {/* --- PROFILE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          
          <div className="flex items-center space-x-6">
            
            {/* --- UPDATED AVATAR DISPLAY --- */}
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
                  {[1,2,3,4,5].map(star => <span key={star}>★</span>)}
                </div>
                <span>No ratings yet</span>
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
            <span className="block text-3xl font-sans font-medium text-gray-800">0</span>
            <span className="text-gray-600 text-lg">Swaps</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-sans font-medium text-gray-800">{myBooks.length}</span>
            <span className="text-gray-600 text-lg">Books</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-sans font-medium text-gray-800">{userProfile.rating}</span>
            <span className="text-gray-600 text-lg">Ratings</span>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex justify-around border-b border-gray-200 mb-8">
          {[
            { id: 'bookshelf', label: 'My Bookshelf' },
            { id: 'swaps', label: 'Swaps History' },
            { id: 'reviews', label: 'Reviews' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xl transition-colors ${
                activeTab === tab.id 
                  ? 'text-gray-900 font-bold border-b-2 border-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT --- */}
        <div className="w-full">
          {activeTab === 'bookshelf' && (
            <div>
              {myBooks.length === 0 ? (
                // --- EMPTY STATE ---
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
                // --- POPULATED BOOKSHELF ---
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
                      <p className="text-gray-500 text-xs text-center w-full truncate px-2">{book.author}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'swaps' && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
               <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
               </svg>
               <h3 className="text-2xl font-bold text-gray-800 mb-2">No swaps yet</h3>
               <p className="text-gray-500 font-sans text-center">Your swap history will appear here once you make your first trade.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
               <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
               </svg>
               <h3 className="text-2xl font-bold text-gray-800 mb-2">No reviews yet</h3>
               <p className="text-gray-500 font-sans text-center">Complete a swap to start earning ratings from the community.</p>
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