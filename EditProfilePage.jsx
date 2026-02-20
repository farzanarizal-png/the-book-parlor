import React, { useState, useRef } from 'react';   
import { useNavigate } from 'react-router-dom'; 

// --- IF YOU ARE READY TO SAVE TO FIREBASE, UNCOMMENT THESE NEXT TWO LINES ---
// import { auth, db } from '../firebase'; 
// import { doc, updateDoc } from 'firebase/firestore';

function EditProfilePage() { 
  const navigate = useNavigate(); 
  const fileInputRef = useRef(null);  

  const [name, setName] = useState('Hayden'); 
  const [username, setUsername] = useState('bookworm_hayden'); 
  const [location, setLocation] = useState('Kuala Lumpur'); 
  const [bio, setBio] = useState(''); 
  const [profileImage, setProfileImage] = useState(null);  
  
  // --- ADDED: New states for Uploading ---
  const [imageFile, setImageFile] = useState(null); // Holds the actual file for ImgBB
  const [isSaving, setIsSaving] = useState(false);  // Handles the "Saving..." button

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

  // --- UPDATED: Now saves the actual file for ImgBB, and the DataURL for preview ---
  const handleImageChange = (event) => { 
    const file = event.target.files[0]; 
    if (file) { 
      setImageFile(file); // Save the file for ImgBB!

      const reader = new FileReader(); 
      reader.onloadend = () => { 
        setProfileImage(reader.result); // Show the visual preview on screen
      }; 
      reader.readAsDataURL(file); 
    } 
  }; 

  // --- UPDATED: Full ImgBB Upload & Save Logic ---
  const handleSave = async (e) => { 
    e.preventDefault(); 
    setIsSaving(true); // Changes button to "Saving..."

    try {
      let finalImageUrl = profileImage; // Default to existing image if they didn't pick a new one

      // 1. If they picked a new image, send it to ImgBB
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const imgbbResponse = await fetch("https://api.imgbb.com/1/upload?key=92a8bb4dc69657d3bb61b775a7040e1e", {
          method: "POST",
          body: formData,
        });

        const imgbbData = await imgbbResponse.json();

        if (imgbbData.success) {
          finalImageUrl = imgbbData.data.url; // Grab the new secure URL!
        } else {
          alert("Failed to upload image. Please try again.");
          setIsSaving(false);
          return;
        }
      }

      // 2. Save everything to your database
      // --- UNCOMMENT THIS BLOCK IF FIREBASE IS IMPORTED AT THE TOP ---
      /*
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          name: name,
          username: username,
          location: location,
          bio: bio,
          profileImage: finalImageUrl
        });
      }
      */

      console.log("Profile Saved!", { name, username, location, bio, profileImage: finalImageUrl }); 
      navigate('/profile');  

    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Something went wrong while saving!");
    } finally {
      setIsSaving(false); // Turns button back to "Save Changes"
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
              type="button"
              onClick={() => navigate('/profile')} 
              className="text-gray-400 hover:text-gray-700 font-sans text-sm font-bold" 
            > 
              ✕ Cancel 
            </button> 
          </div> 

          <form onSubmit={handleSave} className="space-y-6"> 
              
            {/* --- AVATAR UPLOAD SECTION --- */} 
            <div className="flex items-center space-x-6 mb-8"> 
                
              <div className="w-24 h-24 rounded-full bg-[#f97316] text-white flex items-center justify-center font-sans font-bold text-3xl shadow-sm overflow-hidden"> 
                {profileImage ? ( 
                  <img src={profileImage} alt="Profile Preview" className="w-full h-full object-cover" /> 
                ) : ( 
                  "HA"  
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
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all" 
                /> 
              </div> 

              <div> 
                <label className="block text-gray-700 font-sans text-sm font-bold mb-2">Username</label> 
                <input  
                  type="text"  
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
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
                placeholder="Tell the community a bit about your favorite books..." 
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-[#5d782b] focus:ring-1 focus:ring-[#5d782b] transition-all resize-y" 
              ></textarea> 
            </div> 

            {/* Action Buttons */} 
            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-100"> 
              <button  
                type="button" 
                onClick={() => navigate('/profile')} 
                className="px-6 py-2.5 rounded-full text-gray-600 font-sans font-bold hover:bg-gray-100 transition-colors" 
              > 
                Cancel 
              </button> 
              <button  
                type="submit" 
                disabled={isSaving}
                className={`px-8 py-2.5 rounded-full font-sans font-bold transition-transform shadow-md transform hover:scale-105 ${
                  isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5a7034] hover:bg-[#465728] text-white'
                }`}
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