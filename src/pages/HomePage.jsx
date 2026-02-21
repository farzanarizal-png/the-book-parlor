import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebase'; 
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

function HomePage() {
  const navigate = useNavigate();

  // --- FIREBASE DATA STATES ---
  const [myBookshelf, setMyBookshelf] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [userName, setUserName] = useState("Reader");
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggle State for "See All" Recommended Books
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState([]);

  const hasUnread = notifications.some(n => n.unread);

  useEffect(() => {
    let unsubscribeBooks;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch Current User Profile
          let fetchedName = "Reader";
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.name || data.username) fetchedName = data.name || data.username;
            if (data.profileImage || data.profileImageUrl) {
              setProfileImage(data.profileImage || data.profileImageUrl);
            }
          } else if (user.displayName) {
            fetchedName = user.displayName;
          } else {
            fetchedName = user.email ? user.email.split('@')[0] : "Reader";
          }

          setUserName(fetchedName);

          // 2. Set Dynamic Notifications
          setNotifications([
            { id: 1, text: `Welcome to The Book Parlor, ${fetchedName}! Claim your first spot on the shelf.`, time: "Just now", unread: true }
          ]);

          // 3. Fetch All Users mapping (to fix "Unknown User" & get Location)
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          const usersMap = {};
          usersSnapshot.forEach(userDoc => {
            usersMap[userDoc.id] = userDoc.data();
          });

          // 4. REAL-TIME FIREBASE LINK (Books)
          const booksCollection = collection(db, 'books');
          
          unsubscribeBooks = onSnapshot(booksCollection, (snapshot) => {
            const allBooks = snapshot.docs.map(bookDoc => {
              const bookData = bookDoc.data();
              // Cross-reference the book's ownerId with our usersMap
              const ownerInfo = usersMap[bookData.ownerId] || {};
              
              return {
                id: bookDoc.id,
                ...bookData,
                // Fallback structure: checks book doc first, then user doc, then defaults
                ownerName: bookData.ownerName || ownerInfo.name || ownerInfo.username || 'Unknown User',
                ownerLocation: bookData.location || ownerInfo.location || 'Unknown Location',
                ownerRating: bookData.ownerRating || ownerInfo.rating || 'New'
              };
            });

            // Filter books instantly
            setMyBookshelf(allBooks.filter(book => book.ownerId === user.uid));
            setRecommendedBooks(allBooks.filter(book => book.ownerId !== user.uid));
            setIsLoading(false);
          }, (error) => {
            console.error("Error with real-time books listener:", error);
            setIsLoading(false);
          });

        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    // Cleanup listeners
    return () => {
      unsubscribeAuth();
      if (unsubscribeBooks) unsubscribeBooks();
    };
  }, [navigate]);

  // --- SIGN OUT HANDLER ---
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // ADDED: Clear recent users from local storage on log out
      localStorage.removeItem('bookParlorRecentUsers');
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // --- TOGGLE MENUS ---
  const toggleNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
    setIsDropdownOpen(false); 
    setIsFilterOpen(false);   
    if (!isNotifOpen) setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
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

  const handleNavigation = (item) => {
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
    if (item === 'Rating') navigate('/rating');
  };

  // --- SEARCH FILTER LOGIC ---
  const filteredRecommendedBooks = recommendedBooks.filter((book) => {
    if (!searchQuery) return true; 
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      (book.title && book.title.toLowerCase().includes(lowerCaseQuery)) ||
      (book.author && book.author.toLowerCase().includes(lowerCaseQuery)) ||
      (book.genre && book.genre.toLowerCase().includes(lowerCaseQuery)) ||
      (book.ownerLocation && book.ownerLocation.toLowerCase().includes(lowerCaseQuery))
    );
  });

  const getInitials = (name) => {
    if (!name) return "RE";
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- LOADING SCREEN ---
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#8b9c7d] font-serif text-2xl text-white">Loading your parlor...</div>;
  }

  return (
    <div className="flex h-screen bg-[#8b9c7d] font-serif overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg shrink-0">
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
      <div className="flex-1 flex flex-col relative h-full bg-[#8b9c7d]">
        
        {/* --- HEADER SECTION --- */}
        <div className="px-10 pt-10 pb-6 z-30 bg-[#dde5eb] rounded-bl-2rem shadow-sm">
          <h1 className="text-5xl italic font-bold text-gray-800 mb-2 drop-shadow-sm capitalize">
            Welcome, {userName}!
          </h1>
          <p className="text-2xl text-gray-600 mb-8">Ready to Trade?</p>

          <div className="flex items-center justify-between relative">
            <div className="relative flex items-center bg-[#faf6e9] border border-gray-300 rounded-full w-[60%] px-4 py-2 focus-within:border-gray-500 transition-all shadow-sm">
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Books by title, author, location..." 
                className="bg-transparent border-none outline-none text-lg w-full text-gray-700 placeholder-gray-400 font-sans"
              />
              
              <svg 
                onClick={toggleFilter}
                className={`w-6 h-6 ml-3 cursor-pointer transition-colors ${isFilterOpen ? 'text-[#5d782b]' : 'text-gray-400 hover:text-gray-700'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>

              {isFilterOpen && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden font-sans p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-800 text-lg">Filter Search</h3>
                    <button onClick={toggleFilter} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                    <select className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 outline-none">
                      <option>All Locations</option>
                      <option>Kuala Lumpur</option>
                      <option>Selangor</option>
                      <option>Johor</option>
                      <option>Penang</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Genre</label>
                    <select className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 outline-none">
                      <option>All Genres</option>
                      <option>Fiction</option>
                      <option>Mystery</option>
                      <option>Romance</option>
                    </select>
                  </div>
                  <button onClick={toggleFilter} className="w-full bg-[#5d782b] hover:bg-[#4a6023] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-gray-600 relative">
              
              {/* --- NOTIFICATION BELL --- */}
              <div className="relative">
                <div onClick={toggleNotifications} className="relative cursor-pointer group p-1">
                  <svg className={`w-7 h-7 transition-colors ${isNotifOpen ? 'text-gray-900' : 'hover:text-gray-900'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  {hasUnread && <span className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#dde5eb]"></span>}
                </div>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
                    <div className="bg-gray-50 border-b px-5 py-3"><h3 className="font-bold">Notifications</h3></div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className="px-5 py-4 border-b hover:bg-gray-50 cursor-pointer">
                          <p className="text-sm text-gray-800 mb-1">{notif.text}</p>
                          <span className="text-xs text-gray-400">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Icon */}
              <svg onClick={() => navigate('/chat')} className="w-7 h-7 cursor-pointer hover:text-gray-900 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-2 cursor-pointer ml-4 group" onClick={toggleProfileDropdown}>
                  <div className="w-10 h-10 rounded-full bg-[#f97316] text-white flex items-center justify-center font-sans font-bold text-sm uppercase overflow-hidden">
                    {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : getInitials(userName)}
                  </div>
                  <span className="text-xl text-gray-800 capitalize">{userName}</span>
                  
                  {/* --- NEW DROPDOWN CHEVRON ICON --- */}
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-4 w-48 bg-white rounded-lg shadow-2xl z-50">
                    <button onClick={() => navigate('/profile')} className="w-full text-left px-5 py-3 hover:bg-gray-50">My Profile</button>
                    <button onClick={handleSignOut} className="w-full text-left px-5 py-3 hover:bg-red-50 text-red-600">Sign Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pt-8 pb-32 hide-scrollbar z-10">
          
          {/* --- MY BOOKSHELF --- */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#2d3a24]">My Bookshelf</h2>
              <button onClick={() => navigate('/profile')} className="bg-[#6b7b5c] hover:bg-[#536145] text-white px-5 py-1.5 rounded-full text-md transition-colors shadow-md">See All {'>'}</button>
            </div>
            {myBookshelf.length === 0 ? (
              <p className="text-lg italic text-[#4a583d]">Your shelf is looking a little bare! Add a book to get started.</p>
            ) : (
              <div className="flex space-x-8 overflow-x-auto pb-4 hide-scrollbar">
                {myBookshelf.map((book) => (
                  <div key={book.id} onClick={() => navigate(`/book/${book.id}`)} className="flex flex-col items-center min-w-140px group cursor-pointer">
                    <div className="w-32 h-48 bg-[#cad3c3] relative flex items-center justify-center rounded-md shadow-md mb-2 transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden">
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full font-sans font-bold text-[8px] uppercase z-10 ${book.status === 'Available' ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'}`}>{book.status || 'Available'}</div>
                      {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0 z-0" /> : <span className="text-gray-600 text-sm font-sans z-10">{book.title}</span>}
                    </div>
                    <h3 className="font-bold text-[#2d3a24] text-center text-sm w-full truncate">{book.title}</h3>
                    <p className="text-[#4a583d] text-xs text-center w-full truncate">{book.author}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- RECOMMENDED SECTION --- */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#2d3a24]">Recommended</h2>
              <button 
                onClick={() => setShowAllRecommended(!showAllRecommended)} 
                className="bg-[#6b7b5c] hover:bg-[#536145] text-white px-5 py-1.5 rounded-full text-md transition-colors shadow-md"
              >
                {showAllRecommended ? 'Show Less' : 'See All >'}
              </button>
            </div>
            
            <div className={`${showAllRecommended ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6' : 'flex space-x-8 overflow-x-auto pb-6 hide-scrollbar'}`}>
              {filteredRecommendedBooks.length > 0 ? (
                filteredRecommendedBooks.map((book) => (
                  <div key={book.id} onClick={() => navigate(`/book/${book.id}`)} className={`flex flex-col items-center group cursor-pointer ${showAllRecommended ? 'w-full' : 'min-w-150px w-150px'}`}>
                    <div className="w-32 h-48 bg-[#cad3c3] relative flex items-center justify-center rounded-md shadow-md mb-3 transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden">
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full font-sans font-bold text-[8px] uppercase tracking-widest shadow-md z-10 ${book.status === 'Available' ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'}`}>{book.status || 'Available'}</div>
                      {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0 z-0" /> : <span className="text-gray-600 text-sm font-sans font-medium leading-snug z-10 text-center px-1">{book.title}</span>}
                    </div>
                    <h3 className="font-bold text-[#2d3a24] text-center leading-tight mb-1 text-sm w-full truncate px-1">{book.title}</h3>
                    <p className="text-[#4a583d] text-xs text-center w-full truncate mb-1">{book.author}</p>
                    
                    {/* Updated Owner & Location Badge */}
                    <div className="flex flex-col w-full px-2 mt-1 bg-white/50 rounded-lg py-1.5 border border-white/50 shadow-sm font-sans">
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <span className="text-[10px] text-gray-800 font-bold truncate pr-1">👤 {book.ownerName}</span>
                        <span className="text-[10px] text-yellow-700 font-bold whitespace-nowrap">★ {book.ownerRating}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 truncate">📍 {book.ownerLocation}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#2d3a24] italic w-full mt-4">No books found matching your search.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- CUSTOM FAB --- */}
        <div onClick={() => navigate('/add-book')} className="absolute bottom-8 right-8 flex flex-col items-center justify-center w-32 h-32 bg-[#f4f2e9] rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-all z-50">
          <div className="relative mb-1 flex justify-center items-center">
            <svg width="40" height="30" viewBox="0 0 50 50" fill="none"><path d="M28 6C28 6 20 0 10 0C4 0 2 6 2 6V42C2 42 6 38 12 38C20 38 28 44 28 44V6Z" fill="#7a8b99"/><path d="M32 6C32 6 40 0 50 0C56 0 58 6 58 6V42C58 42 54 38 48 38C40 38 32 44 32 44V6Z" fill="#7a8b99"/></svg>
            <div className="absolute inset-0 flex items-center justify-center pt-1"><div className="bg-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7a8b99" strokeWidth="4" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21"></line><line x1="3" y1="12" x2="21" y2="12"></line></svg></div></div>
          </div>
          <div className="text-center font-serif text-[12px] leading-tight text-gray-800 font-medium mt-1">Add a New<br/>Book</div>
        </div>
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
export default HomePage;