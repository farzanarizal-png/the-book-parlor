import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  where,
  updateDoc 
} from 'firebase/firestore';
import { put } from '@vercel/blob';

// --- HELPER FUNCTIONS ---
const formatMeetupDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  const d = new Date(`${dateStr}T${timeStr}`);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const notifiedMeetupsRef = useRef(new Set());

  // Navigation State
  const ownerName = location.state?.ownerName;
  const passedOwnerId = location.state?.ownerId;             
  const passedChatId = location.state?.chatId;
  const safeOwnerId = passedOwnerId || ownerName || "unknown_reader";
  const isDirectChat = Boolean(ownerName) || Boolean(passedChatId);
  
  // Component States
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inboxChats, setInboxChats] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [meetupDetails, setMeetupDetails] = useState({ date: '', time: '', location: '' });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const chatId = passedChatId || (currentUser?.uid && safeOwnerId ? [currentUser.uid, safeOwnerId].sort().join('_') : null);

  // --- 1. REAL-TIME CLOCK & NOTIFICATIONS ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const activeMeetups = messages.filter(m => m.type === 'meetup' && m.meetupData?.status === 'accepted');

  useEffect(() => {
    activeMeetups.forEach((msg) => {
      const meetupDateObj = new Date(`${msg.meetupData.date}T${msg.meetupData.time}`);
      const minutesLeft = Math.floor((meetupDateObj - currentTime) / 60000);

      if ([60, 30, 5].includes(minutesLeft)) {
        const notificationId = `${msg.id}-${minutesLeft}`;
        if (!notifiedMeetupsRef.current.has(notificationId)) {
          notifiedMeetupsRef.current.add(notificationId);
          const body = `Your swap at ${msg.meetupData.location} is in ${minutesLeft} minutes!`;
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Meetup Reminder", { body });
          } else {
            alert(body);
          }
        }
      }
    });
  }, [currentTime, activeMeetups]);

  // --- 2. FIREBASE LISTENERS ---
  useEffect(() => {
    if (!isDirectChat && currentUser) {
      const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
      return onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetched.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setInboxChats(fetched);
      });
    }
  }, [isDirectChat, currentUser]);

  useEffect(() => {
    if (!isDirectChat || !chatId || !currentUser) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [chatId, isDirectChat, currentUser]);

  // --- 3. HANDLERS ---
  const updateChatMetadata = async (lastMessageText) => {
    if (!currentUser || !chatId) return;
    try {
      await setDoc(doc(db, "chats", chatId), {
        participants: [currentUser.uid, safeOwnerId], 
        lastMessage: lastMessageText,
        updatedAt: serverTimestamp(),
        [`name_${safeOwnerId}`]: ownerName || "Fellow Reader",
        [`name_${currentUser.uid}`]: currentUser.displayName || currentUser.email?.split('@')[0] || "Someone"
      }, { merge: true });
    } catch (error) {}
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentUser || !chatId) return;
    setIsUploadingImage(true);
    try {
      const blob = await put(`chat/${Date.now()}_${file.name}`, file, {
        access: 'public',
        token: "vercel_blob_rw_KEK87zzaDBf6xeR8_SxQV9ZGQMDc4ZYLdnOoXV8ISJAqS68" 
      });
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        imageUrl: blob.url,
        type: 'image',
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      await updateChatMetadata("Sent an image");
    } catch (error) {
      alert("Upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    const text = inputText; setInputText("");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.uid, text, type: 'text',
      createdAt: serverTimestamp(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    await updateChatMetadata(text);
  };

  const handleAcceptMeetup = async (id) => {
    await updateDoc(doc(db, "chats", chatId, "messages", id), { "meetupData.status": "accepted" });
    await updateChatMetadata("✅ Meetup Accepted!");
  };

  const handleCompleteMeetup = async (id) => {
    // Mark as completed in DB
    await updateDoc(doc(db, "chats", chatId, "messages", id), { "meetupData.status": "completed" });
    await updateChatMetadata("🤝 Swap Completed!");
    
    // REDIRECT TO RATING PAGE
    navigate('/rating', { 
      state: { 
        partnerId: safeOwnerId, 
        partnerName: ownerName || "Fellow Reader" 
      } 
    });
  };

  const handleConfirmMeeting = async () => {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.uid, 
      type: 'meetup',
      text: `PROPOSED MEETUP\nLocation: ${meetupDetails.location}\nDate: ${meetupDetails.date}\nTime: ${meetupDetails.time}`,
      meetupData: { ...meetupDetails, status: 'pending' },
      createdAt: serverTimestamp(), 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    await updateChatMetadata("📅 Proposed a meetup");
    setShowMeetupModal(false);
  };

  // --- 4. RENDER INBOX VIEW ---
  if (!isDirectChat) {
    return (
      <div className="min-h-screen bg-[#faf6e9] flex flex-col font-serif">
         <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Messages</h1>
          <button onClick={() => navigate('/home')} className="text-[#5d782b] font-bold text-sm uppercase tracking-widest">Back</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {inboxChats.map(chat => {
              const otherId = chat.participants?.find(id => id !== currentUser?.uid);
              const otherName = chat[`name_${otherId}`] || "Fellow Reader";
              return (
                <div key={chat.id} onClick={() => navigate('/chat', { state: { ownerId: otherId, ownerName: otherName, chatId: chat.id } })} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#cddce6] rounded-full flex items-center justify-center text-xl font-bold text-gray-700">{otherName.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{otherName}</h3>
                      <p className="text-gray-500 font-sans text-sm truncate max-w-200px md:max-w-md">{chat.lastMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- 5. RENDER DIRECT CHAT VIEW ---
  return (
    <div className="flex flex-col h-screen bg-[#faf6e9] font-serif overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#b5c5d1] h-16 flex items-center px-4 shadow-sm z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-800 font-bold">←</button>
        <h2 className="font-bold text-gray-800 uppercase tracking-tight">{ownerName || 'Chat'}</h2>
      </div>

      {/* NOTIFICATION BANNER */}
      {("Notification" in window) && Notification.permission === "default" && (
        <div className="bg-[#5d782b] text-white px-6 py-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest z-20">
          <span>Get alerts for your meetups?</span>
          <button onClick={() => Notification.requestPermission()} className="bg-white text-[#5d782b] px-3 py-1 rounded-full">Allow</button>
        </div>
      )}

      {/* MESSAGES THREAD */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          
          if (msg.type === 'meetup' && (msg.meetupData?.status === 'accepted' || msg.meetupData?.status === 'completed')) {
            const isTimePassed = currentTime >= new Date(`${msg.meetupData.date}T${msg.meetupData.time}`);
            return (
              <div key={msg.id} className="flex flex-col items-center justify-center space-y-3 my-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-8 py-5 text-center shadow-sm max-w-sm">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {msg.meetupData.status === 'completed' ? <strong>🤝 Swap Completed!</strong> : <strong>Meetup Confirmed!</strong>}
                    <br/>
                    {msg.meetupData.status === 'completed' ? "You met up on " : "Meetup confirmed for "}
                    <span className="font-bold text-[#5d782b]">{formatMeetupDateTime(msg.meetupData.date, msg.meetupData.time)}</span> at <strong>{msg.meetupData.location}</strong>.
                  </p>
                </div>
                {msg.meetupData.status === 'accepted' && (
                  <button 
                    disabled={!isTimePassed}
                    onClick={() => handleCompleteMeetup(msg.id)}
                    className={`font-bold py-2 px-8 rounded-full text-[10px] uppercase tracking-widest transition shadow-sm ${
                      isTimePassed ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isTimePassed ? "We Met Up" : "Waiting for Meetup..."}
                  </button>
                )}
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm relative ${isMe ? 'bg-[#5d782b] text-white' : 'bg-white text-gray-800'}`}>
                {msg.type === 'image' ? (
                  <img src={msg.imageUrl} alt="upload" className="rounded-lg max-h-60" />
                ) : msg.type === 'meetup' ? (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold opacity-70 tracking-tighter">Proposed Meetup</div>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    {!isMe && msg.meetupData?.status === 'pending' && (
                      <button onClick={() => handleAcceptMeetup(msg.id)} className="w-full mt-2 bg-white text-[#5d782b] font-bold py-1 rounded text-xs border border-[#5d782b]">Accept Proposal</button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                <p className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-gray-400'}`}>{msg.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* INPUT BAR */}
      <div className="bg-white border-t border-gray-100 p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button type="button" onClick={() => setShowMeetupModal(true)} className="p-2 bg-[#faf6e9] rounded-lg hover:scale-105 transition shadow-sm">🗓️</button>
          
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
          <button type="button" disabled={isUploadingImage} onClick={() => fileInputRef.current.click()} className="p-2 bg-[#faf6e9] rounded-lg hover:scale-105 transition shadow-sm">
             {isUploadingImage ? "..." : "📷"}
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-[#f8f8f8] border-none rounded-xl py-3 px-5 text-sm outline-none font-sans"/>
            <button type="submit" className="bg-[#5d782b] text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition">Send</button>
          </form>
        </div>
      </div>

      {/* MODAL */}
      {showMeetupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-32px p-8 w-full max-w-sm shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-gray-800">Propose Meetup</h3>
            <div className="space-y-3 font-sans">
              <input type="text" placeholder="Location" className="w-full border-gray-200 border p-3 rounded-xl text-sm" value={meetupDetails.location} onChange={(e) => setMeetupDetails({...meetupDetails, location: e.target.value})} />
              <input type="date" className="w-full border-gray-200 border p-3 rounded-xl text-sm" value={meetupDetails.date} onChange={(e) => setMeetupDetails({...meetupDetails, date: e.target.value})} />
              <input type="time" className="w-full border-gray-200 border p-3 rounded-xl text-sm" value={meetupDetails.time} onChange={(e) => setMeetupDetails({...meetupDetails, time: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2 font-bold uppercase text-[10px] tracking-widest">
              <button onClick={() => setShowMeetupModal(false)} className="flex-1 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleConfirmMeeting} className="flex-1 bg-[#5d782b] text-white py-3 rounded-xl shadow-lg active:scale-95 transition">Send Proposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;