"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// Import the Zustand store
import { useTestUploadStore } from "./testUploadStore"; // Adjust path if needed

// Removed type definitions

export default function TestUploadPage() {
  // Select state and actions from the Zustand store
  const {
    selectedFile,
    previewUrl,
    uploadedUrl,
    isUploading,
    error,
    // Actions
    setFileAndPreview,
    uploadFile,
    // clearFile // Optionally select if needed for a reset button
  } = useTestUploadStore();

  // --- Event Handlers that call store actions ---
  const handleFileChange = (e) => { // Type annotation removed
    setFileAndPreview(e.target.files?.[0]); // Pass file (or null) to store action
  };

  const handleUploadClick = () => { // Renamed for clarity
    uploadFile(); // Call store action
  };

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload</CardTitle>
          <CardDescription>Test Vercel Blob image upload functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="image">Select Image</Label>
            {/* Use store action in onChange */}
            <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative h-60 w-full overflow-hidden rounded-md border">
                {/* Read previewUrl from store */}
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="h-full w-full object-contain" />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {/* Upload Button */}
          <Button
            onClick={handleUploadClick}
            // Disable button if no file selected or currently uploading
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Image"
            )}
          </Button>

          {/* Uploaded Result */}
          {uploadedUrl && (
            <div className="space-y-2">
              <Label>Uploaded Image URL</Label>
              {/* Read uploadedUrl from store */}
              <div className="break-all rounded-md bg-muted p-2 text-sm">{uploadedUrl}</div>
              <div className="relative h-60 w-full overflow-hidden rounded-md border">
                {/* Display uploaded image */}
                <img src={uploadedUrl || "/placeholder.svg"} alt="Uploaded" className="h-full w-full object-contain" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}