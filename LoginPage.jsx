import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTANT: Make sure this path points to your firebase.js file
import { db, auth } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  // This helps us prove the browser actually loaded this new version!
  console.log("🔥 NEW CODE IS RUNNING! 🔥");

  const [users, setUsers] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch users from Firebase (which holds the Vercel Blob image links)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Attempting to fetch users from Firebase...");
        const querySnapshot = await getDocs(collection(db, "users"));
        const fetchedUsers = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({ id: doc.id, ...doc.data() });
        });
        console.log("Users found in database:", fetchedUsers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Firebase fetch error:", error);
      }
    };
    fetchUsers();
  }, []);

  // 2. Prepare exactly 6 slots for the shelf
  const displaySlots = [...users];
  while (displaySlots.length < 6) {
    displaySlots.push({ isEmpty: true, id: `empty-${displaySlots.length}` });
  }
  
  const topRow = displaySlots.slice(0, 3);
  const bottomRow = displaySlots.slice(3, 6);

  const handleBookClick = (user) => {
    console.log("Clicked user:", user.username);
    setSelectedBook(user);
    setPassword('');
    setShowPassword(false);
  };

  // 3. Handle Firebase Login
  const handleLogin = async () => {
    if (!password) {
      alert("Please enter a password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, selectedBook.email, password);
      alert(`Successfully logged in as ${selectedBook.username}!`);
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Login failed:", error);
      alert("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Component for individual book slots
  const BookSlot = ({ item }) => {
    // If it's an empty slot, show the PLUS sign to add an account
    if (item.isEmpty) {
      return (
        <div 
          onClick={() => navigate('/signup')}
          className="w-20 h-32 md:w-24 md:h-36 bg-[#f0f0f0] hover:bg-white border-2 border-[#ccc] hover:border-[#9db490] rounded-sm flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
          title="Add New Account"
        >
          <span className="text-3xl text-gray-400 hover:text-[#5d782b]">➕</span>
        </div>
      );
    }

    // If it is a real user, show their Vercel Blob image or a fallback cover
    return (
      <div
        onClick={() => handleBookClick(item)}
        className={`w-20 h-32 md:w-24 md:h-36 bg-white rounded-sm cursor-pointer transition-all duration-300 transform shadow-lg overflow-hidden border-2 origin-bottom relative ${
          selectedBook?.id === item.id 
            ? '-translate-y-4 border-[#9db490] ring-4 ring-[#9db490]/50 shadow-2xl scale-110 z-20' 
            : 'border-transparent hover:-translate-y-2 hover:shadow-xl'
        }`}
        title={item.username}
      >
        {item.profileImage ? (
          <img 
            src={item.profileImage} 
            alt={item.username} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#c5d1bb] flex items-center justify-center p-2 border-4 border-[#a1af96]">
            <span className="text-center font-bold text-[#333] break-word text-sm">
              {item.username}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* LEFT SIDE: Bookshelf */}
      <div className="relative w-full md:w-1/2 h-full flex flex-col items-center bg-[#faf6e9]">
        <img src="bookshelf.png" alt="Background" className="absolute inset-0 w-full h-full object-cover z-0 object-center" />
        <h2 className="absolute top-[20%] md:top-[22%] z-10 text-white text-4xl md:text-5xl italic drop-shadow-md text-center px-4" style={{ fontFamily: "'Georgia', serif" }}>
          Pick Your Favourite Book
        </h2>

        <div className="absolute top-[42%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          {topRow.map((item) => <BookSlot key={item.id} item={item} />)}
        </div>

        <div className="absolute top-[67%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          {bottomRow.map((item) => <BookSlot key={item.id} item={item} />)}
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full md:w-1/2 h-full bg-[#a1af96] flex flex-col items-center justify-between py-12 px-6 md:px-12 text-white relative z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
        
        <div className="mt-8 flex flex-col items-center w-full">
          <img src="logo.png" className="w-64 md:w-80 drop-shadow-md" alt="The Book Parlor" />
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mt-20px">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 tracking-wide drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            Login
          </h1>

          <div className="w-full min-h-180px flex flex-col items-center transition-all duration-300">
            {selectedBook ? (
              <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                <p className="mb-4 text-lg">Logging in as: <span className="font-bold">{selectedBook.username}</span></p>
                <div className="w-full flex items-center bg-white/20 border-2 border-transparent focus-within:border-white focus-within:bg-white/30 rounded-full mb-4 overflow-hidden transition-all shadow-inner">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={`Password for ${selectedBook.username}`}
                    className="flex-1 py-3 pl-6 pr-2 bg-transparent text-white placeholder-white/70 focus:outline-none text-left text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="mr-2 px-4 py-1.5 text-sm font-bold text-white bg-[#5d782b]/70 hover:bg-[#5d782b] rounded-full transition-colors shadow-sm">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                <button onClick={handleLogin} disabled={loading} className="w-full py-3 mb-3 bg-[#5d782b] hover:bg-[#222] text-white rounded-full text-lg font-semibold shadow-md transition-colors disabled:opacity-50">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            ) : (
              <p className="text-white/80 italic text-lg mt-8 text-center px-4 leading-relaxed">
                Please pick your book from the shelf to log in.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center w-full max-w-[320px]">
          <p className="text-xl md:text-2xl mb-4 text-white drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>New here? Join the Parlor</p>
          <button onClick={() => navigate('/signup')} className="w-full py-3 bg-[#5d782b] hover:bg-[#4a6023] text-white rounded-full text-lg font-semibold shadow-md transition-colors transform hover:scale-[1.02]">
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;