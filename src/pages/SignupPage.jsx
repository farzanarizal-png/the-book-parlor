import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Firebase Imports ---
import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- UPDATED: Vercel Blob Import ---
import { put } from '@vercel/blob';

function SignupPage() {   
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // States for the image preview AND the actual file to upload
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null); 
  const [imageFile, setImageFile] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const topSlots = [1, 2, 3];
  const bottomSlots = [4, 5, 6];

  const handleSlotClick = (slotId) => {
    setSelectedSlot(slotId);
    setFormData({ email: '', username: '', password: '' });
    setUploadedImagePreview(null); 
    setImageFile(null);
    setErrorMessage(''); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrorMessage(''); 
  };

  // --- Handle Image Selection ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Save the actual file for Vercel Blob

      // Create a temporary local URL just to show the preview on screen
      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl); 
    }
  };

  // --- Registration with Vercel Blob ---
  const handleRegister = async () => {
    if (!formData.email || !formData.username || !formData.password) {
      setErrorMessage('Please fill in all fields!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      let finalImageUrl = null;

      // 1. Upload to Vercel Blob FIRST (if they selected an image)
      if (imageFile) {
        try {
          // --- UPDATED: Using 'put' and your direct Token ---
          const newBlob = await put(`avatars/${Date.now()}_${imageFile.name}`, imageFile, {
            access: 'public',
            token: "vercel_blob_rw_KEK87zzaDBf6xeR8_SxQV9ZGQMDc4ZYLdnOoXV8ISJAqS68"
          });
          finalImageUrl = newBlob.url; // Get the secure URL from Vercel
        } catch (uploadError) {
          console.error("Vercel Blob upload failed:", uploadError);
          setErrorMessage("Failed to upload image. Please try again.");
          setIsLoading(false);
          return; // Stop signup if image fails
        }
      }

      // 2. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Update the Auth profile with their Username
      await updateProfile(user, {
        displayName: formData.username,
        photoURL: finalImageUrl // Save the Blob URL to Firebase Auth too!
      });

      // 4. Save details to Firestore Database using the Vercel Blob URL
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: formData.username,
        email: formData.email,
        bookshelfSlot: selectedSlot,
        profileImage: finalImageUrl, 
        createdAt: serverTimestamp()
      });

      alert(`Account created successfully! Welcome, ${formData.username}.`);
      navigate('/home'); 

    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Try logging in.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#faf6e9] font-serif overflow-hidden">
      
      {/* LEFT SIDE: Bookshelf */}
      <div className="relative w-full md:w-1/2 h-full flex flex-col items-center bg-[#faf6e9]">
        <img src="bookshelf.png" alt="3D Bookshelf Background" className="absolute inset-0 w-full h-full object-cover z-0 object-center" />

        <h2 className="absolute top-[20%] md:top-[22%] z-10 text-white text-4xl md:text-5xl italic drop-shadow-md text-center px-4" style={{ fontFamily: "'Georgia', serif" }}>
          Add a New Book to the shelf
        </h2>

        {/* --- ROW 1: TOP EMPTY SLOTS --- */}
        <div className="absolute top-[44%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          {topSlots.map((id) => (
            <div key={id} onClick={() => handleSlotClick(id)}
              className={`w-20 h-32 md:w-24 md:h-36 rounded-sm cursor-pointer transition-all duration-300 transform shadow-lg overflow-hidden border-2 origin-bottom flex flex-col items-center justify-center relative ${
                selectedSlot === id ? '-translate-y-4 border-[#9db490] ring-4 ring-[#9db490]/50 shadow-2xl scale-110 bg-white' : 'bg-[#f0f0f0] border-[#ccc] hover:-translate-y-2 hover:shadow-xl opacity-90'
              }`}
            >
              {selectedSlot === id ? (
                uploadedImagePreview ? (
                  <img src={uploadedImagePreview} alt="Uploaded Profile" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor={`upload-${id}`} className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center text-[#555]">
                    <span className="text-2xl text-[#9db490] mb-1">📷</span>
                    <p className="text-[0.65rem] md:text-xs leading-tight font-sans">Upload Profile Picture</p>
                    <input id={`upload-${id}`} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )
              ) : (
                /* --- AMENDED: Book Icon replacing the + Icon --- */
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* --- ROW 2: BOTTOM EMPTY SLOTS --- */}
        <div className="absolute top-[69%] z-10 flex gap-6 md:gap-8 justify-center w-full px-4 items-end">
          {bottomSlots.map((id) => (
            <div key={id} onClick={() => handleSlotClick(id)}
              className={`w-20 h-32 md:w-24 md:h-36 rounded-sm cursor-pointer transition-all duration-300 transform shadow-lg overflow-hidden border-2 origin-bottom flex flex-col items-center justify-center relative ${
                selectedSlot === id ? '-translate-y-4 border-[#9db490] ring-4 ring-[#9db490]/50 shadow-2xl scale-110 bg-white' : 'bg-[#f0f0f0] border-[#ccc] hover:-translate-y-2 hover:shadow-xl opacity-90'
              }`}
            >
              {selectedSlot === id ? (
                uploadedImagePreview ? (
                  <img src={uploadedImagePreview} alt="Uploaded Profile" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor={`upload-${id}`} className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center text-[#555]">
                    <span className="text-2xl text-[#9db490] mb-1">📷</span>
                    <p className="text-[0.65rem] md:text-xs leading-tight font-sans">Upload Profile Picture</p>
                    <input id={`upload-${id}`} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )
              ) : (
                /* --- AMENDED: Book Icon replacing the + Icon --- */
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Sign Up Form Area */}
      <div className="w-full md:w-1/2 h-full bg-[#a1af96] flex flex-col items-center justify-between py-12 px-6 md:px-12 text-white relative z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
        
        <div className="mt-8 flex flex-col items-center w-full">
          <img src="logo.png" className="w-64 md:w-80 drop-shadow-md" alt="The Book Parlor" />
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mt-20px">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-wide drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            Sign Up
          </h1>

          <div className="w-full min-h-250px flex flex-col items-center transition-all duration-300">
            {selectedSlot ? (
              <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                
                {errorMessage && (
                  <div className="w-full bg-red-500/80 text-white text-sm py-2 px-4 rounded-lg mb-4 text-center font-sans shadow-sm">
                    {errorMessage}
                  </div>
                )}

                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full px-6 py-3 mb-3 rounded-full bg-white/20 text-white placeholder-white/70 border border-transparent focus:outline-none focus:border-white focus:bg-white/30 text-center text-lg transition-all shadow-inner" />
                <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="w-full px-6 py-3 mb-3 rounded-full bg-white/20 text-white placeholder-white/70 border border-transparent focus:outline-none focus:border-white focus:bg-white/30 text-center text-lg transition-all shadow-inner" />
                
                <div className="w-full flex items-center bg-white/20 border-2 border-transparent focus-within:border-white focus-within:bg-white/30 rounded-full mb-6 overflow-hidden transition-all shadow-inner">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="flex-1 py-3 pl-6 pr-2 bg-transparent text-white placeholder-white/70 focus:outline-none text-left text-lg" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="mr-2 px-4 py-1.5 text-sm font-bold text-white bg-[#5d782b]/70 hover:bg-[#5d782b] rounded-full transition-colors shadow-sm">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                <button onClick={handleRegister} disabled={isLoading} className="w-full py-3 bg-[#5d782b] hover:bg-[#222] text-white rounded-full text-lg font-semibold shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                  {isLoading ? "Creating Account..." : "Register"}
                </button>
              </div>
            ) : (
              <p className="text-white/80 italic text-lg mt-12 text-center px-4 leading-relaxed">
                Select an empty slot on the shelf to begin your story.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center w-full max-w-[320px]">
          <p className="text-xl md:text-2xl mb-4 text-white drop-shadow-sm" style={{ fontFamily: "'Lora', serif" }}>
            Already have an account?
          </p>
          <button onClick={() => navigate('/login')} className="w-full py-3 bg-[#5d782b] hover:bg-[#4a6023] text-white rounded-full text-lg font-semibold shadow-md transition-colors transform hover:scale-[1.02]">
            Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default SignupPage;