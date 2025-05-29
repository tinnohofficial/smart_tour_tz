"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { X, Upload, CheckCircle, AlertCircle, Loader2, ImageIcon } from "lucide-react"
import { uploadService } from '@/app/services/api'
import { toast } from 'sonner'
import Image from "next/image"

export function SingleImageUploader({ onChange, value, className = "" }) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(value || null)

  // Update local state when value prop changes (for edit mode)
  useEffect(() => {
    setUploadedImage(value || null)
  }, [value])

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        try {
          setUploading(true)
          const response = await uploadService.uploadFile(file)
          setUploadedImage(response.url)
          onChange(response.url)
          toast.success('Image uploaded successfully!')
        } catch (error) {
          toast.error(`Upload failed: ${error.message}`)
        } finally {
          setUploading(false)
        }
      }
    },
    [onChange]
  )

  const removeImage = () => {
    setUploadedImage(null)
    onChange(null)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    multiple: false
  })

  // If we have an uploaded image, show the preview with option to change
  if (uploadedImage) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative group">
          <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-gray-200">
            <Image
              src={uploadedImage}
              alt="Uploaded destination image"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setUploadedImage(null)}
                  className="bg-white/90 hover:bg-white text-black"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Change
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={removeImage}
                  className="bg-red-600/90 hover:bg-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show upload area
  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? "border-amber-700 bg-amber-50" 
            : "border-gray-300 hover:border-amber-300 hover:bg-amber-50/30"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          {uploading ? (
            <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
          ) : (
            <ImageIcon className="h-12 w-12 text-gray-400" />
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {uploading 
                ? "Uploading image..." 
                : isDragActive 
                  ? "Drop the image here" 
                  : "Upload destination image"
              }
            </p>
            {!uploading && (
              <>
                <p className="text-xs text-gray-500">
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-400">
                  Supports: JPEG, PNG, WebP, GIF
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}