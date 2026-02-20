import { useState } from 'react';

export default function EditProfile() {
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    event.preventDefault();
    setUploading(true);

    const fileInput = event.target.elements.file;
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a file first!");
      setUploading(false);
      return;
    }
    
    try {
      // Send the file to our new Vercel API route
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      const data = await response.json();
      
      if (response.ok) {
        setImageUrl(data.url); // The direct image link!
        console.log("Success! Image saved at:", data.url);
      } else {
        console.error("Upload failed:", data.error);
      }
      
    } catch (error) {
      console.error("Error connecting to upload API:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="file" name="file" accept="image/*" required />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Saving...' : 'Upload Picture'}
      </button>

      {imageUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>Upload successful!</p>
          <img src={imageUrl} alt="Profile Preview" width="100" style={{ borderRadius: '50%' }} />
        </div>
      )}
    </form>
  );
}