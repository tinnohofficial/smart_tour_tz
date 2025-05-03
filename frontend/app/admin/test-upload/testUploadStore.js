import { create } from 'zustand';
import { toast } from 'sonner'; // Import toast from sonner

export const useTestUploadStore = create((set, get) => ({
  // --- State ---
  selectedFile: null,
  previewUrl: null,
  uploadedUrl: null,
  isUploading: false,
  error: null,

  // --- Actions ---

  // Handles file selection and preview generation
  setFileAndPreview: (file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        set({ error: "Please select an image or PDF file" });
        toast.error("Invalid file type. Please select an image or PDF file");
        return;
      }
      set({ selectedFile: file, error: null, uploadedUrl: null }); // Reset error/uploaded URL on new file select
      // Only create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          set({ previewUrl: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        set({ previewUrl: 'pdf' }); // Just a marker for PDF files
      }
    } else {
      // Clear state if no file is selected (e.g., user cancels file dialog)
      set({ selectedFile: null, previewUrl: null, error: null, uploadedUrl: null });
    }
  },

  // Clears the selected file and related state
  clearFile: () => {
    set({ selectedFile: null, previewUrl: null, error: null, uploadedUrl: null });
  },

  // Action to upload the selected file
  uploadFile: async () => {
    const { selectedFile } = get(); // Get current file from state
    if (!selectedFile) {
      set({ error: "Please select a file first" });
      toast.warning("Please select a file first"); // Use sonner toast
      return;
    }

    set({ isUploading: true, error: null, uploadedUrl: null }); // Start uploading, clear errors/previous URL
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", selectedFile);

      const response = await fetch("/api/upload", { // Ensure this API route exists
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMsg = `Failed to upload ${selectedFile.type.startsWith('image/') ? 'image' : 'PDF'}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (_) { /* Ignore if response is not JSON */ }
        throw new Error(errorMsg);
      }

      const { url } = await response.json();
      set({ uploadedUrl: url });
      toast.success(`${selectedFile.type.startsWith('image/') ? 'Image' : 'PDF'} uploaded successfully!`); // Use sonner toast

    } catch (err) {
      console.error("Error uploading file:", err);
      const errorMsg = err instanceof Error ? err.message : `Failed to upload ${selectedFile.type.startsWith('image/') ? 'image' : 'PDF'}`;
      set({ error: errorMsg });
      toast.error(`Upload failed: ${errorMsg}`); // Use sonner toast
    } finally {
      set({ isUploading: false });
    }
  },
}));