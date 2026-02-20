import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// --- VERCEL BLOB IMPORT ---
import { put } from '@vercel/blob';

function EditProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('Kuala Lumpur');
  const [bio, setBio] = useState('');
  
  const [profileImage, setProfileImage] = useState(null); // Local preview URL
  const [selectedFile, setSelectedFile] = useState(null); // Raw file object for Vercel upload

  // --- FETCH EXISTING PROFILE DATA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.name) setName(data.name);
            if (data.username) setUsername(data.username);
            if (data.location) setLocation(data.location);
            if (data.bio) setBio(data.bio);
            if (data.profileImage || data.profileImageUrl) {
                // Check both in case your db uses one or the other
                setProfileImage(data.profileImage || data.profileImageUrl);
            }
          } else {
            setUsername(`@reader${user.uid.substring(0, 4)}`);
          }
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
    if (item === 'Profile') navigate('/profile'); 
    if (item === 'Chat') navigate('/chat');
    if (item === 'Rating') navigate('/rating');
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // Save the raw file object for Vercel Blob

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // Set a local base64 preview for the UI
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SAVE DATA TO FIREBASE & VERCEL BLOB ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      let finalImageUrl = profileImage; // Keep existing image by default

      // If a new file was selected, upload it to Vercel Blob
      if (selectedFile) {
        // NOTE: Ensure your Vercel Token is configured in your .env file as VITE_BLOB_READ_WRITE_TOKEN
        const blob = await put(`profileImages/${user.uid}-${selectedFile.name}`, selectedFile, {
          access: 'public',
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN 
        });
        
        finalImageUrl = blob.url; // Get the permanent URL from Vercel
      }

      // Update the user's document in Firestore with the Vercel URL
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name,
        username,
        location,
        bio,
        profileImage: finalImageUrl // Aligned with the field naming you might be using
      }, { merge: true }); 

      console.log("Profile successfully updated!");
      navigate('/profile'); // Successfully routes back to profile on save
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please check your console for errors.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#faf6e9] font-serif text-2xl">Loading Editor...</div>;
  }

  return (
    <div className="flex h-screen bg-[#faf6e9] font-serif overflow-hidden">
        
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#b5c5d1] flex flex-col items-center py-8 z-20 shadow-lg shrink-0">
        <div 
          onClick={() => navigate('/home')}
          className="bg-[#faf6e9] rounded-2xl p-4 mb-10 w-4/5 shadow-sm flex justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <img src="../logo.png" alt="The Book Parlor" className="w-full h-auto" />
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
      <div className="flex-1 overflow-y-auto px-10 md:px-20 py-12 relative h-full">
          
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100 mt-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
            <h1 className="text-4xl font-bold text-gray-800">Edit Profile</h1>
            <button 
              onClick={() => navigate('/profile')}
              className="text-gray-400 hover:text-gray-700 font-sans text-sm font-bold"
              disabled={isSaving}
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
              
            {/* --- AVATAR UPLOAD SECTION --- */}
            <div className="flex items-center space-x-6 mb-8">
                
              {/* Profile Image Container - Adjusted to match standard layouts without the orange HA */}
              <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-gray-200 text-gray-400 flex items-center justify-center shadow-sm overflow-hidden relative">
                {profileImage ? (
                  <img src={profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  // Neutral SVG icon if no image is present
                  <svg className="w-14 h-14 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
                
              <div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={handleUploadClick}
                  className="bg-[#f2f2f2] hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-full font-sans text-sm transition-colors border border-gray-300 shadow-sm"
                >
                  {profileImage ? 'Update Picture' : 'Change Picture'}
                </button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Location</label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all cursor-pointer"
              >
                <option value="Kuala Lumpur">Kuala Lumpur</option>
                <option value="Selangor">Selangor</option>
                <option value="Penang">Penang</option>
                <option value="Perak">Perak</option>
                <option value="Kedah">Kedah</option>
                <option value="Kelantan">Kelantan</option>
                <option value="Pahang">Pahang</option>
                <option value="Terengganu">Terengganu</option>
                <option value="Perlis">Perlis</option>
                <option value="Negeri Sembilan">Negeri Sembilan</option>
                <option value="Melaka">Melaka</option>
                <option value="Johor">Johor</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Bio (Optional)</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="4"
                placeholder="Tell the community a bit about yourself..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all resize-y"
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => navigate('/profile')}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full text-gray-600 font-sans font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-[#5a7034] hover:bg-[#465728] text-white px-8 py-2.5 rounded-full font-sans font-bold transition-transform shadow-md transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default EditProfilePage;