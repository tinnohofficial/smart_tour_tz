/**
 * Uploads a file to Vercel Blob storage using a serverless function
 * to generate the signed upload URL.
 *
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} A promise that resolves with the public URL of the uploaded file (without query parameters).
 * @throws {Error} If any step of the upload process fails.
 */
export const uploadToBlob = async (file) => {
    if (!file) {
      throw new Error("No file provided for upload.");
    }
  
    try {
      // Sanitize filename: replace spaces with hyphens and prepend timestamp
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  
      // 1. Request a signed upload URL from our backend API route
      const response = await fetch("/api/upload-url", { // Assuming '/api/upload-url' handles the signed URL generation
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          filename: filename,
          contentType: file.type,
          // Optional: Send additional info your backend might use (e.g., for authorization or logging)
          clientPayload: JSON.stringify({
            uploadContext: "license_document", // Example context
            originalFilename: file.name,
          }),
        }),
      });
  
      if (!response.ok) {
        const errorBody = await response.text(); // Try to get more error details
        console.error("Failed to get upload URL:", response.status, errorBody);
        throw new Error(`Failed to get upload URL (status: ${response.status})`);
      }
  
      // The backend should return the signed URL and necessary headers
      // The exact structure might vary based on your '/api/upload-url' implementation
      const { url, headers } = await response.json();
  
      if (!url) {
          throw new Error("Received invalid response from upload URL endpoint (missing URL).")
      }
  
      // 2. Upload the file directly to the returned signed URL (Vercel Blob storage)
      const uploadResponse = await fetch(url, {
        method: "PUT",
        // Headers might be required by the signed URL (e.g., Content-Type)
        // Pass the headers returned from your API if necessary, or just the file type
        headers: {
           // Spread headers from backend if provided, otherwise set Content-Type
          ...(headers || {}), // Spread if headers object exists
          "content-type": file.type, // Often needed for PUT to blob storage
        },
        body: file, // The actual file content
      });
  
      if (!uploadResponse.ok) {
         const errorBody = await uploadResponse.text();
         console.error("Failed to upload file to storage:", uploadResponse.status, errorBody);
        throw new Error(`Failed to upload file to storage (status: ${uploadResponse.status})`);
      }
  
      // 3. Return the clean URL (without query parameters like SAS tokens)
      // The base URL is usually what you store and use publicly
      return url.split("?")[0];
  
    } catch (error) {
      // Log the specific error caught during the process
      console.error("Error during blob upload:", error);
      // Re-throw a more generic error for the caller to handle
      throw new Error("File upload failed. Please try again.");
    }
  };