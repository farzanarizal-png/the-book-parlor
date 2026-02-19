import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase'; // Ensure auth is imported
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef();

  // 1. DATA FROM NAVIGATION STATE (Passed from BookDetailsPage or Inbox)
  const ownerName = location.state?.ownerName;
  const ownerId = location.state?.ownerId;             // Highly recommended to pass this!
  const bookTitle = location.state?.bookTitle;         // Their book
  const myOfferedBook = location.state?.myOfferedBook; // Your book
  
  // If ownerName exists, we are in a 1-on-1 chat. Otherwise, we show the Inbox.
  const isDirectChat = Boolean(ownerName);
  
  // 2. COMPONENT STATES
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [meetupDetails, setMeetupDetails] = useState({ date: '', time: '', location: '' });

  // Handle Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Create a more robust unique Room ID (Prevents everyone chatting with "Sarah" from sharing the same room)
  // It uses the passed chatId, OR combines the two user IDs, OR falls back to the old ownerName logic.
  const chatId = location.state?.chatId 
    ? location.state.chatId 
    : (currentUser?.uid && ownerId) 
      ? [currentUser.uid, ownerId].sort().join('_') 
      : ownerName ? `chat_${ownerName.replace(/\s+/g, '_')}` : null;

  // 3. REAL-TIME FIREBASE LISTENER
  useEffect(() => {
    if (!isDirectChat || !chatId || !currentUser) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetched);
    });

    return () => unsubscribe(); // Cleanup listener when leaving page
  }, [chatId, isDirectChat, currentUser]);

  // 4. AUTO-SCROLL TO NEWEST MESSAGE
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. SEND STANDARD TEXT MESSAGE
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.uid, // Replaced hardcoded 'me' with actual User ID
      text: inputText,
      createdAt: serverTimestamp(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setInputText("");
  };

  // 6. SEND MEETUP PROPOSAL
  const handleConfirmMeeting = async () => {
    if (!meetupDetails.date || !meetupDetails.location) {
      alert("Please fill in the meeting date and location.");
      return;
    }
    if (!currentUser) return;

    const proposalText = `📅 PROPOSED MEETUP\nDate: ${meetupDetails.date}\nTime: ${meetupDetails.time}\nLocation: ${meetupDetails.location}`;
    
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.uid, // Replaced hardcoded 'me'
      text: proposalText,
      createdAt: serverTimestamp(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'meetup' 
    });
    
    setShowMeetupModal(false);
    setMeetupDetails({ date: '', time: '', location: '' });
  };

  // ==========================================
  // SCENARIO A: EMPTY INBOX (Accessed via Sidebar)
  // ==========================================
  if (!isDirectChat) {
    return (
      <div className="min-h-screen bg-[#faf6e9] flex flex-col font-serif">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <button onClick={() => navigate('/home')} className="text-[#5d782b] font-bold text-sm uppercase tracking-widest">Back</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">💬</div>
          <h3 className="text-xl font-bold text-gray-600">No Messages Yet</h3>
          <p className="mt-2 font-sans text-sm max-w-xs">Visit the library and request a swap to start a conversation with other readers.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCENARIO B: ACTIVE 1-ON-1 CHAT VIEW
  // ==========================================
  return (
    <div className="flex flex-col h-screen bg-[#faf6e9] font-serif">
      {/* HEADER WITH SWAP DEAL DETAILS */}
      <div className="bg-[#b5c5d1] h-20 flex items-center px-6 shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="mr-4 hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800 leading-tight">{ownerName}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-[#5d782b] text-white text-[9px] px-2 py-0.5 rounded font-sans font-bold uppercase tracking-tighter shadow-sm">Swap Deal</span>
            <p className="text-xs text-gray-700 font-sans italic truncate max-w-200px md:max-w-none">
              {myOfferedBook ? `"${myOfferedBook}"` : "My Book"} ↔ "{bookTitle}"
            </p>
          </div>
        </div>
      </div>

      {/* MESSAGES THREAD */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          // Changed logic: Compare msg sender ID to the logged-in user's ID
          const isMe = msg.senderId === currentUser?.uid;
          const isSystem = msg.senderId === 'system';
          const isMeetup = msg.type === 'meetup';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                isSystem ? 'bg-gray-100/80 text-gray-500 text-xs italic border border-gray-200 px-8 py-2' :
                isMeetup ? 'bg-orange-50 border-2 border-orange-200 text-gray-800' :
                isMe ? 'bg-[#5d782b] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {isMeetup && <span className="block text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-widest">Proposed Meetup</span>}
                <p className={`text-sm md:text-base whitespace-pre-line leading-relaxed ${isSystem ? 'text-center' : ''}`}>{msg.text}</p>
                {!isSystem && <p className={`text-[9px] mt-1 font-sans font-bold uppercase ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{msg.time}</p>}
              </div>
            </div>
          );
        })}
        {/* Invisible div to scroll into view */}
        <div ref={scrollRef} />
      </div>

      {/* CHAT INPUT BAR */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => setShowMeetupModal(true)} 
          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          title="Set Meetup"
        >
           📅
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message owner..."
          className="flex-1 bg-gray-50 border-0 rounded-xl py-3 px-5 focus:ring-2 focus:ring-[#5d782b] outline-none font-sans"
        />
        <button type="submit" className="bg-[#5d782b] text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg uppercase text-xs tracking-widest">
           Send
        </button>
      </form>

      {/* MEETUP DETAILS MODAL */}
      {showMeetupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Confirm Meetup</h3>
            <div className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</label>
                <input type="date" className="w-full border-gray-200 rounded-xl p-3 bg-gray-50" 
                  onChange={(e) => setMeetupDetails({...meetupDetails, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time</label>
                <input type="time" className="w-full border-gray-200 rounded-xl p-3 bg-gray-50" 
                  onChange={(e) => setMeetupDetails({...meetupDetails, time: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Location</label>
                <input type="text" placeholder="e.g. Starbucks KLCC" className="w-full border-gray-200 rounded-xl p-3 bg-gray-50" 
                  onChange={(e) => setMeetupDetails({...meetupDetails, location: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowMeetupModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-400 uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={handleConfirmMeeting} className="flex-1 py-3 rounded-xl bg-[#5d782b] font-bold text-white shadow-lg uppercase text-xs tracking-widest">Send Proposal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;