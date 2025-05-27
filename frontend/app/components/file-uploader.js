"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { X, Upload, File } from "lucide-react"
import { create } from 'zustand'

const useFileUploaderStore = create((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
  addFile: (newFile) => set((state) => ({ files: [...state.files, newFile] })),
  removeFileByIndex: (indexToRemove) => set((state) => ({
    files: state.files.filter((_, index) => index !== indexToRemove),
  })),
  clearFiles: () => set({ files: [] }),
}));


// FileUploader component
export function FileUploader(props) { 
  const { onChange, maxFiles = 5, acceptedFileTypes } = props; 
  const { files, setFiles, removeFileByIndex } = useFileUploaderStore();

  // This function handles the file drop event
  const onDrop = useCallback(
    (acceptedFiles) => { 
      const newFiles = [...files]; 

      acceptedFiles.forEach((file) => {
        if (newFiles.length < maxFiles) {
          newFiles.push(file);
        }
      });

      setFiles(newFiles); 
      onChange(newFiles);
    },
    [files, maxFiles, onChange, setFiles], 
  );

  // This function handles the file removal event
  const removeFile = (index) => {
    removeFileByIndex(index); 
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index); 
    onChange(updatedFiles);
  };

// This function sets up the dropzone properties
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes
      ? acceptedFileTypes.split(",").reduce(
          (acc, type) => {
            acc[type] = []
            return acc
          },
          {}
        )
      : undefined,
    maxFiles,
  });

  return (
    <div className="space-y-4">
    {/* Drag and drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-amber-700 bg-amber-50" : "border-amber-200 hover:border-amber-300"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-gray-500" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">
            {maxFiles > 1 ? `Upload up to ${maxFiles} files` : "Upload 1 file"}
          </p>
        </div>
      </div>

    {/* File list display */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-background">
              <div className="flex items-center gap-2 truncate">
                <File className="h-4 w-4 text-amber-600" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <Button type="button" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 text-white bg-amber-700 hover:bg-amber-800">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}