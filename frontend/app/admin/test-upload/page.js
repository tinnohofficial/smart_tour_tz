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
          <CardTitle>Test File Upload</CardTitle>
          <CardDescription>Test file upload functionality for images and PDFs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            {/* Updated to accept both image and PDF files */}
            <Input id="file" type="file" accept="image/*,.pdf" onChange={handleFileChange} />
          </div>

          {/* Preview */}
          {previewUrl && selectedFile && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative h-60 w-full overflow-hidden rounded-md border">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-medium">PDF Document</p>
                      <p className="text-sm text-gray-500">{selectedFile.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {/* Upload Button */}
          <Button
            onClick={handleUploadClick}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFile?.type.startsWith('image/') ? 'Image' : 'PDF'}`
            )}
          </Button>

          {/* Uploaded Result */}
          {uploadedUrl && (
            <div className="space-y-2">
              <Label>Uploaded File URL</Label>
              <div className="break-all rounded-md bg-muted p-2 text-sm">{uploadedUrl}</div>
              {selectedFile?.type.startsWith('image/') ? (
                <div className="relative h-60 w-full overflow-hidden rounded-md border">
                  <img src={uploadedUrl} alt="Uploaded" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-60 w-full items-center justify-center rounded-md border bg-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-medium">PDF Document</p>
                    <p className="text-sm text-gray-500">
                      <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View PDF
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}