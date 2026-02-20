import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  try {
    // Parse the body to handle the incoming request from your React app
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // This tells Vercel Blob what files are allowed
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("✅ Image successfully uploaded to Vercel Blob:", blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Upload API Error:", error.message);
    return response.status(400).json({ error: error.message });
  }
}