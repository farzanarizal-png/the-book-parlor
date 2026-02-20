import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase"; 
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { put } from "@vercel/blob"; 

const EditBookPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Book data state (Added description/synopsis field)
  const [book, setBook] = useState({
    title: "",
    author: "",
    description: "", // Added this line
    status: "AVAILABLE",
    coverUrl: "" 
  });

  // 1. Fetch Book Data from Firestore
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const docRef = doc(db, "books", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge fetched data with default state to ensure 'description' exists
          setBook({ ...book, ...data });
          setPreviewUrl(data.coverUrl); 
        } else {
          alert("Book not found!");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // 2. Handle Image Selection for Local Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // 3. Handle Update (Upload to Vercel Blob -> Save to Firestore)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalCoverUrl = book.coverUrl;

      // If a new image was selected, upload it to Vercel Blob
      if (imageFile) {
        const blob = await put(`covers/${id}_${imageFile.name}`, imageFile, {
          access: 'public',
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN, 
        });
        
        finalCoverUrl = blob.url; 
      }

      // Update Firestore document with new text and the Blob URL
      const docRef = doc(db, "books", id);
      await updateDoc(docRef, {
        ...book,
        coverUrl: finalCoverUrl
      });

      alert("Book successfully updated!");
      navigate("/home"); 
    } catch (error) {
      console.error("Error updating book:", error);
      alert("Failed to update book. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  // 4. Handle Delete Book
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${book.title}"?`);
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "books", id));
        alert("Book deleted.");
        navigate("/home"); 
      } catch (error) {
        console.error("Error deleting book:", error);
        alert("Failed to delete book.");
      }
    }
  };

  if (loading) return <div className="text-center mt-20 font-serif text-gray-600">Loading Book Details...</div>;

  return (
    <div className="min-h-screen bg-[#fcf8ef] flex flex-col items-center py-12 px-4 font-serif">
      <div className="flex flex-col md:flex-row gap-12 max-w-4xl w-full">
        
        {/* Left Side: Live Preview */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-64 h-96 bg-[#c2cfc1] rounded-md shadow-sm flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
            <span className="absolute top-3 right-3 bg-[#6b8e23] text-white text-[10px] px-3 py-1 rounded-full font-sans font-bold z-10 tracking-wider">
              {book.status}
            </span>
            
            {previewUrl ? (
              <img src={previewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-[#3b5966] text-lg text-center px-4 z-10 font-medium">
                {book.title || 'Untitled'}
              </p>
            )}
          </div>
          
          <div className="mt-6 text-center">
             <h2 className="text-xl font-bold text-[#001f3f] tracking-wide">{book.title || 'Book Title'}</h2>
             <p className="text-gray-500 mt-1">{book.author || 'Author Name'}</p>
          </div>

          <input 
            type="file" 
            onChange={handleImageChange} 
            className="mt-6 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            accept="image/*"
          />
        </div>

        {/* Right Side: Edit Form */}
        <div className="flex-1 flex flex-col justify-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Edit Details</h1>
          
          <form onSubmit={handleUpdate} className="flex flex-col gap-5 w-full font-sans">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
              <input
                type="text"
                required
                value={book.title}
                onChange={(e) => setBook({...book, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                required
                value={book.author}
                onChange={(e) => setBook({...book, author: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            {/* NEW: Synopsis/Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Synopsis</label>
              <textarea
                rows="4"
                value={book.description || ""}
                onChange={(e) => setBook({...book, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none transition resize-none"
                placeholder="Write a brief synopsis or description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={book.status}
                onChange={(e) => setBook({...book, status: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none transition"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="SWAPPED">SWAPPED</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6 justify-center">
              <button
                type="submit"
                disabled={uploading}
                className={`px-8 py-2 rounded-full border text-sm font-bold transition-colors ${
                  uploading 
                  ? 'bg-blue-50 text-blue-300 border-blue-200 cursor-not-allowed' 
                  : 'bg-[#f0f7ff] text-[#0056b3] border-[#cce5ff] hover:bg-[#e0f0ff]'
                }`}
              >
                {uploading ? 'Saving...' : 'Edit'}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="px-8 py-2 rounded-full border bg-[#fff0f0] text-[#cc0000] border-[#ffcccc] hover:bg-[#ffe0e0] text-sm font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookPage;