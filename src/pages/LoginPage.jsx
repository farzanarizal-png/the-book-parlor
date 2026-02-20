import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const [recentUsers, setRecentUsers] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load Recent Users from localStorage (will be empty after sign out)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bookParlorRecentUsers')) || [];
    setRecentUsers(saved);
  }, []);

  // Logic to fill the shelf with 6 slots
  const displaySlots = [...recentUsers];
  while (displaySlots.length < 6) {
    displaySlots.push({ isEmpty: true, id: `empty-${displaySlots.length}` });
  }
  const topRow = displaySlots.slice(0, 3);
  const bottomRow = displaySlots.slice(3, 6);

  const handlePlusClick = () => {
    setSelectedBook(null);
    setIsManualLogin(true);
    setEmail('');
    setPassword('');
  };

  const handleBookClick = (user) => {
    setSelectedBook(user);
    setIsManualLogin(false);
    setPassword('');
  };

  const handleLogin = async () => {
    const loginEmail = selectedBook ? selectedBook.email : email;
    if (!loginEmail || !password) return alert("Please fill in credentials");

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // Fetch user data from Firestore to save to the shelf for next time
      const q = query(collection(db, "users"), where("email", "==", loginEmail));
      const snap = await getDocs(q);
      let userData = null;
      snap.forEach((doc) => { userData = { id: doc.id, ...doc.data() }; });

      if (userData) {
        const currentSaved = JSON.parse(localStorage.getItem('bookParlorRecentUsers')) || [];
        const filtered = currentSaved.filter(u => u.email !== userData.email);
        const newList = [{
          email: userData.email,
          username: userData.name || userData.username,
          profileImage: userData.profileImage || userData.profileImageUrl,
          id: userData.id
        }, ...filtered].slice(0, 6);
        localStorage.setItem('bookParlorRecentUsers', JSON.stringify(newList));
      }

      navigate('/home');
    } catch (error) {
      alert("Login failed. Please check your password.");
    } finally {
      setLoading(false);
    }
  };

  const BookSlot = ({ item }) => {
    if (item.isEmpty) {
      return (
        <div onClick={handlePlusClick} className="w-20 h-32 md:w-24 md:h-36 bg-white/20 border-2 border-dashed border-white/40 rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all shadow-md origin-bottom">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      );
    }
    return (
      <div onClick={() => handleBookClick(item)} 
           className={`w-20 h-32 md:w-24 md:h-36 bg-white rounded-sm cursor-pointer transition-all transform shadow-lg border-2 origin-bottom ${selectedBook?.email === item.email ? '-translate-y-4 border-[#9db490] ring-4 ring-[#9db490]/50' : 'border-transparent hover:-translate-y-2'}`}>
        {item.profileImage ? (
          <img src={item.profileImage} className="w-full h-full object-cover" alt="user" />
        ) : (
          <div className="w-full h-full bg-[#c5d1bb] flex items-center justify-center p-2">
            <span className="text-[10px] font-bold text-[#333] uppercase text-center">{item.username}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#faf6e9] font-serif overflow-hidden">
      {/* Left side: The Shelf */}
      <div className="relative w-full md:w-1/2 h-full flex flex-col items-center bg-[#faf6e9]">
        <img src="bookshelf.png" className="absolute inset-0 w-full h-full object-cover z-0 object-center" alt="shelf" />
        {/* MATCHED: Shelf Heading Size & Font */}
        <h2 className="absolute top-[20%] md:top-[22%] z-10 text-white text-4xl md:text-5xl italic drop-shadow-md text-center px-4" style={{ fontFamily: "'Georgia', serif" }}>
          Pick Your Book
        </h2>
        <div className="absolute top-[42%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">{topRow.map((item, i) => <BookSlot key={item.id || i} item={item} />)}</div>
        <div className="absolute top-[67%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">{bottomRow.map((item, i) => <BookSlot key={item.id || i} item={item} />)}</div>
      </div>

      {/* Right side: Login Form */}
      {/* MATCHED: Padding and Shadow */}
      <div className="w-full md:w-1/2 h-full bg-[#a1af96] flex flex-col items-center justify-between py-12 px-6 md:px-12 text-white relative z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
        
        {/* MATCHED: Logo Size */}
        <div className="mt-8 flex flex-col items-center w-full">
          <img src="logo.png" className="w-64 md:w-80 drop-shadow-md" alt="Logo" />
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mt-20px">
          {/* MATCHED: H1 Text Size & Font */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-wide drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            Login
          </h1>
          
          {/* MATCHED: Min-height wrapper */}
          <div className="w-full min-h-250px flex flex-col items-center transition-all duration-300">
            {selectedBook || isManualLogin ? (
              <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                {!selectedBook && (
                  // MATCHED: Input text size (text-lg) and layout
                  <input type="email" placeholder="Email Address" className="w-full px-6 py-3 mb-3 rounded-full bg-white/20 text-white placeholder-white/70 border border-transparent focus:outline-none focus:border-white focus:bg-white/30 text-center text-lg transition-all shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} />
                )}
                
                {selectedBook && <p className="mb-4 text-center italic text-lg text-white/90">Logging in as: <b>{selectedBook.username}</b></p>}
                
                {/* MATCHED: Password wrapper and text size (text-lg) */}
                <div className="w-full flex items-center bg-white/20 border-2 border-transparent focus-within:border-white focus-within:bg-white/30 rounded-full mb-6 overflow-hidden transition-all shadow-inner">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className="flex-1 py-3 pl-6 pr-2 bg-transparent text-white placeholder-white/70 focus:outline-none text-left text-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button onClick={() => setShowPassword(!showPassword)} className="mr-2 px-4 py-1.5 text-sm font-bold text-white bg-[#5d782b]/70 hover:bg-[#5d782b] rounded-full transition-colors shadow-sm">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                {/* MATCHED: Button text size (text-lg font-semibold) */}
                <button onClick={handleLogin} disabled={loading} className="w-full py-3 bg-[#5d782b] hover:bg-[#4a6023] rounded-full text-lg font-semibold shadow-md transition-colors disabled:opacity-70">
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            ) : (
              // MATCHED: Placeholder text size (text-lg)
              <p className="text-white/80 italic text-lg mt-12 text-center px-4 leading-relaxed">
                Choose a book from the shelf to login.
              </p>
            )}
          </div>
        </div>

        {/* MATCHED: Bottom text sizing and fonts */}
        <div className="mb-6 flex flex-col items-center w-full max-w-[320px]">
          <p className="text-xl md:text-2xl mb-4 text-white drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            New here? Join the Parlor
          </p>
          <button onClick={() => navigate('/signup')} className="w-full py-3 border-2 border-white rounded-full hover:bg-white hover:text-[#a1af96] text-lg font-semibold shadow-md transition-all transform hover:scale-[1.02]">
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;