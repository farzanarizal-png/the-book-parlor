'use server';
import { put } from '@vercel/blob';

export async function uploadProfilePicture(formData) {
  const file = formData.get('file');
  
  if (!file) {
    throw new Error('No file provided');
  }

  // Upload the file to Vercel Blob
  const blob = await put(file.name, file, {
    access: 'public', // Makes the image viewable on the web
  });

  // Return the direct URL to the new image!
  return blob.url; 
}