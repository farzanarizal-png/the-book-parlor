import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- NEW: Import Firebase database functions ---
import { db } from '../firebase'; // Adjust the '../' if your firebase.js is in a different folder
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function AddBookPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleNavigation = (item) => {
    if (item === 'Home') navigate('/home');
    if (item === 'Add a New Book') { /* Already here */ }
    if (item === 'Profile') navigate('/profile');
    if (item === 'Chat') navigate('/chat');
    if (item === 'Rating') navigate('/rating');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // <-- NEW: Loading state for saving
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  // --- UPDATED: Set default condition to one of your new options ---
  const [condition, setCondition] = useState('Good / Lightly Read');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // --- Google Books API Search ---
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    
    setIsSearching(true);
    
    try {
      const isISBN = /^\d+$/.test(query);
      const apiQuery = isISBN ? `isbn:${query}` : query;

      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(apiQuery)}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        
        setTitle(book.title || '');
        setAuthor(book.authors ? book.authors.join(', ') : '');
        setGenre(book.categories ? book.categories[0] : '');
        setSynopsis(book.description || '');
        
        const image = book.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
        setCoverUrl(image);
      } else {
        alert("Book not found in Google's database. No worries! You can type the details manually and upload your own cover.");
      }
    } catch (error) {
      console.error("Error fetching book:", error);
      alert("Something went wrong with the search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- Manual Cover Upload Handler ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  // --- NEW: Save to Firebase Firestore ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Create a new document in the "books" collection
      await addDoc(collection(db, 'books'), {
        title: title,
        author: author,
        genre: genre,
        condition: condition,
        synopsis: synopsis,
        coverUrl: coverUrl,
        status: "Available", // By default, new books are available to swap
        ownerName: "Hayden", // HARDCODED for now until we set up Login!
        createdAt: serverTimestamp() // Tags the exact time it was added
      });

      alert(`${title} has been successfully added to your bookshelf!`);
      navigate('/profile'); 
      
    } catch (error) {
      console.error("Error adding book to Firebase: ", error);
      alert("Failed to save the book. Check your console for details.");
    } finally {
      setIsSaving(false);
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
                item === 'Add a New Book' 
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
      <div className="flex-1 overflow-y-auto hide-scrollbar relative h-full">
        
        {/* Header */}
        <div className="px-10 pt-10 pb-6 bg-[#dde5eb] shrink-0 border-b border-gray-200">
          <h1 className="text-5xl italic font-bold text-gray-800 mb-2 drop-shadow-sm">
            Add a New Book
          </h1>
          <p className="text-xl text-gray-600 font-sans">
            Search for a book or enter the details manually to add it to your shelf.
          </p>
        </div>

        <div className="p-10 max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-10">
          
          {/* Form Section */}
          <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            
            {/* --- GOOGLE BOOKS SEARCH BAR --- */}
            <form onSubmit={handleSearch} className="mb-8 p-4 bg-[#f4f7f2] rounded-2xl border border-[#d4dfc7]">
              <label className="block text-[#5d782b] font-sans text-sm font-bold mb-2">
                ⚡ Auto-fill with Google Books (Try ISBN for local books!)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter book title or ISBN..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all"
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#5d782b] hover:bg-[#4a6023] text-white px-6 py-3 rounded-lg font-sans font-bold transition-colors shadow-sm disabled:opacity-70 whitespace-nowrap"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* --- MANUAL/EDIT FORM --- */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Book Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Author</label>
                  <input 
                    type="text" 
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Genre</label>
                  <input 
                    type="text" 
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Romantik, Thriller, Sci-Fi"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b]"
                  />
                </div>
              </div>

              {/* --- UPDATED: Condition Dropdown Options --- */}
              <div>
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Condition</label>
                <select 
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] cursor-pointer"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good / Lightly Read">Good / Lightly Read</option>
                  <option value="Acceptable / Heavily Read">Acceptable / Heavily Read</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Synopsis</label>
                <textarea 
                  required
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows="5"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] resize-y"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#5a7034] hover:bg-[#4a6023] text-white px-8 py-3 rounded-full font-sans font-bold transition-transform shadow-md transform hover:scale-105 disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Add to Bookshelf'}
                </button>
              </div>
            </form>
          </div>

          {/* --- COVER PREVIEW SECTION --- */}
          <div className="lg:w-1/3 flex flex-col items-center">
            <h3 className="text-gray-700 font-sans text-sm font-bold mb-4 w-full text-left">Cover Image</h3>
            
            <div className="w-full aspect-2/3 bg-[#e8ede4] rounded-2xl border-2 border-dashed border-[#b5c5d1] flex items-center justify-center overflow-hidden shadow-inner relative mb-4">
              {coverUrl ? (
                <img src={coverUrl} alt="Book Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400 p-6 text-center">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-sans text-sm">Cover will appear here</p>
                </div>
              )}
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-full bg-[#f2f2f2] hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-sans text-sm font-bold transition-colors border border-gray-300 shadow-sm"
            >
              + Upload Custom Cover
            </button>
            <p className="text-xs text-gray-400 font-sans mt-2 text-center">
              If the Google search doesn't find your book, you can upload a photo of the cover manually!
            </p>

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

export default AddBookPage;