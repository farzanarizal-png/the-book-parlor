import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebase'; 
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function BookDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  // --- STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [bookData, setBookData] = useState(null);
  const [myBookshelf, setMyBookshelf] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [selectedBookToOffer, setSelectedBookToOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA FROM FIREBASE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // 1. Fetch the details of the book being viewed
        const bookRef = doc(db, 'books', id);
        const bookSnap = await getDoc(bookRef);
        
        if (bookSnap.exists()) {
          let fetchedBook = { id: bookSnap.id, ...bookSnap.data() };

          // ROBUST FALLBACKS based on your database structure
          fetchedBook.displayImage = fetchedBook.coverUrl || fetchedBook.imageUrl || null;
          fetchedBook.displayLocation = fetchedBook.location || fetchedBook.city || 'Unknown';
          fetchedBook.displayDescription = fetchedBook.description || fetchedBook.synopsis || 'No description provided.';

          // --- FETCH OWNER NAME FROM USERS COLLECTION ---
          if (fetchedBook.ownerId) {
            try {
              const userRef = doc(db, 'users', fetchedBook.ownerId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                fetchedBook.ownerName = userData.name || userData.username || userData.displayName || "Unknown User";
                fetchedBook.ownerRating = userData.rating || "New";
              } else {
                fetchedBook.ownerName = "Unknown User";
                fetchedBook.ownerRating = "New";
              }
            } catch (err) {
              console.error("Error fetching the owner's profile:", err);
              fetchedBook.ownerName = "Unknown User";
            }
          }

          setBookData(fetchedBook);
        } else {
          console.log("No such book!");
          setBookData(null);
        }

        // 2. Fetch the user's available books for the swap modal
        if (user) {
          const q = query(
            collection(db, 'books'), 
            where("ownerId", "==", user.uid),
            where("status", "in", ["AVAILABLE", "Available", "available"]) // Handle case differences
          );
          const myBooksSnap = await getDocs(q);
          const myBooks = myBooksSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              displayImage: data.coverUrl || data.imageUrl || null
            };
          });
          setMyBookshelf(myBooks);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  // --- NAVIGATION ---
  const handleNavigation = (item) => {
    if (item === 'Home') navigate('/home');
    if (item === 'Add a New Book') navigate('/add-book');
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
  };

  // --- SWAP LOGIC ---
  const handleRequestSwap = () => {
    if (!auth.currentUser) {
      alert("Please log in to request a swap!");
      navigate('/login');
      return;
    }
    if (bookData.ownerId === auth.currentUser.uid) {
      alert("You cannot swap a book with yourself!");
      return;
    }
    setIsModalOpen(true);
  };

  // --- UPDATED SUBMIT LOGIC ---
  const confirmSwap = async () => {
    if (!selectedBookToOffer) {
      alert("Please select a book to offer first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save the swap request to your database
      await addDoc(collection(db, 'swapRequests'), {
        requestedBookId: bookData.id,
        requestedBookTitle: bookData.title,
        requestedOwnerId: bookData.ownerId,
        requesterId: auth.currentUser.uid,
        offeredBookId: selectedBookToOffer.id,
        offeredBookTitle: selectedBookToOffer.title,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Show the green success screen
      setSwapSuccess(true);
      
      // 3. After 2 seconds, redirect to Chat AND pass the correct data!
      setTimeout(() => {
        setIsModalOpen(false);
        setSwapSuccess(false);
        
        // --- THIS IS THE CRITICAL CHANGE ---
        // Navigate to the chat page, carrying the EXACT data ChatPage expects
        navigate('/chat', { 
          state: { 
            ownerId: bookData.ownerId,
            ownerName: bookData.ownerName,
            bookTitle: bookData.title,
            myOfferedBook: selectedBookToOffer.title
          } 
        });

      }, 2000);

    } catch (error) {
      console.error("Error submitting swap request:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false); 
    } 
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // --- RENDER LOADING OR NOT FOUND ---
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#faf6e9] font-serif text-2xl">Loading Book Details...</div>;
  }

  if (!bookData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#faf6e9] font-serif">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Book Not Found</h1>
        <button onClick={() => navigate('/home')} className="bg-[#5a7034] text-white px-6 py-2 rounded-full font-sans">Return Home</button>
      </div>
    );
  }

  const currentStatus = bookData.status ? bookData.status.toUpperCase() : 'AVAILABLE';
  const isAvailable = currentStatus === 'AVAILABLE';

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
        
        {/* Back Button Header */}
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
            
            {/* Left Column: Cover */}
            <div className="md:w-1/3 bg-[#cad3c3] p-10 flex items-center justify-center min-h-400px relative">
              
              <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest shadow-md ${
                isAvailable ? 'bg-[#5d782b] text-white' : 'bg-orange-500 text-white'
              }`}>
                {currentStatus}
              </div>

              <div className="w-48 h-72 bg-white rounded-md shadow-2xl flex items-center justify-center border border-gray-200 text-center relative overflow-hidden">
                {bookData.displayImage ? (
                   <img src={bookData.displayImage} alt={bookData.title} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                   <span className="text-gray-500 font-bold text-xl px-4 z-10">{bookData.title}</span>
                )}
              </div>
            </div>

            {/* Right Column: Info */}
            <div className="md:w-2/3 p-10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-4xl font-bold text-gray-800">{bookData.title}</h1>
                  <span className="bg-[#e9ecef] text-gray-600 py-1 px-3 rounded-full text-xs font-sans font-bold tracking-wide uppercase">
                    {bookData.condition || 'Good'}
                  </span>
                </div>
                <p className="text-xl text-gray-600 italic mb-6">by {bookData.author}</p>
                
                <div className="flex space-x-4 mb-6 font-sans text-sm">
                  <span className="bg-[#f0f4eb] text-[#4a6023] py-1.5 px-4 rounded-lg font-semibold flex items-center">
                    📍 {bookData.displayLocation}
                  </span>
                  <span className="bg-blue-50 text-blue-700 py-1.5 px-4 rounded-lg font-semibold flex items-center">
                    📚 {bookData.genre || 'Fiction'}
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Synopsis</h3>
                  <p className="text-gray-600 font-sans leading-relaxed whitespace-pre-line">
                    {bookData.displayDescription}
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100 w-max mb-8">
                  <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-sans font-bold shadow-inner">
                    {getInitials(bookData.ownerName)}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Owned By</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 font-sans">{bookData.ownerName}</p>
                      
                      <div className="flex items-center bg-[#5d782b]/10 px-1.5 py-0.5 rounded-md">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-bold text-[#5d782b] ml-1">{bookData.ownerRating || 'New'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={handleRequestSwap}
                disabled={!isAvailable}
                className={`w-full py-4 rounded-xl font-sans font-bold text-lg transition-transform shadow-md ${
                  isAvailable 
                  ? 'bg-[#5a7034] hover:bg-[#465728] text-white transform hover:scale-[1.02]' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                }`}
              >
                {isAvailable ? 'Request to Swap' : 'Currently Reserved'}
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
                  <p className="text-gray-600 font-sans">We've notified {bookData.ownerName}. Check your Chat soon!</p>
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
                <div className="py-2 text-left">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Offer a Book</h2>
                  <p className="text-gray-600 font-sans mb-6 text-center text-sm">Which book would you like to offer {bookData.ownerName} in exchange for <strong>{bookData.title}</strong>?</p>
                  
                  {/* Selectable Bookshelf Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6 max-h-300px overflow-y-auto px-2 py-2">
                    {myBookshelf.map((book) => (
                      <div 
                        key={book.id}
                        onClick={() => setSelectedBookToOffer(book)}
                        className={`border-2 rounded-xl p-3 cursor-pointer transition-all flex flex-col items-center text-center ${
                          selectedBookToOffer?.id === book.id 
                            ? 'border-[#5a7034] bg-[#5a7034]/5 shadow-md scale-105' 
                            : 'border-gray-200 hover:border-[#5a7034]/50'
                        }`}
                      >
                         <div className="w-16 h-24 bg-gray-200 rounded shadow-sm mb-2 overflow-hidden flex items-center justify-center">
                           {book.displayImage ? (
                             <img src={book.displayImage} alt={book.title} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-[8px] font-sans font-bold text-gray-500 px-1">{book.title}</span>
                           )}
                         </div>
                         <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{book.title}</h4>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedBookToOffer(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-sans font-bold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmSwap}
                      disabled={!selectedBookToOffer || isSubmitting}
                      className={`flex-1 py-3 rounded-xl font-sans font-bold transition-colors ${
                        !selectedBookToOffer || isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#5a7034] hover:bg-[#465728] text-white'
                      }`}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Request'}
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