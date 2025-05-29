"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { X, Upload, File, FileImage, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { create } from 'zustand'
import { uploadService } from '@/app/services/api'
import { toast } from 'sonner'

const useFileUploaderStore = create((set) => ({
  files: [],
  uploadingFiles: new Map(),
  setFiles: (files) => set({ files }),
  addFile: (newFile) => set((state) => ({ files: [...state.files, newFile] })),
  removeFileByIndex: (indexToRemove) => set((state) => ({
    files: state.files.filter((_, index) => index !== indexToRemove),
  })),
  clearFiles: () => set({ files: [], uploadingFiles: new Map() }),
  setUploading: (fileId, status) => set((state) => {
    const newUploading = new Map(state.uploadingFiles)
    if (status) {
      newUploading.set(fileId, status)
    } else {
      newUploading.delete(fileId)
    }
    return { uploadingFiles: newUploading }
  })
}));

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file icon
const getFileIcon = (mimetype) => {
  if (mimetype?.startsWith('image/')) {
    return <FileImage className="h-4 w-4 text-blue-600" />
  }
  return <FileText className="h-4 w-4 text-gray-600" />
}

// Upload status component
const UploadStatus = ({ status }) => {
  if (status === 'uploading') {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Uploading...</span>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" />
        <span>Uploaded</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="h-3 w-3" />
        <span>Failed</span>
      </div>
    )
  }

  return null
}

// FileUploader component
export function FileUploader(props) { 
  const { onChange, maxFiles = 5, acceptedFileTypes, autoUpload = false } = props
  const { files, uploadingFiles, setFiles, removeFileByIndex, setUploading } = useFileUploaderStore()
  const [uploadedFiles, setUploadedFiles] = useState(new Map())

  // Function to upload a single file
  const uploadFile = async (file, index) => {
    const fileId = `${file.name}-${file.lastModified}`
    
    try {
      setUploading(fileId, 'uploading')
      
      const response = await uploadService.uploadFile(file)
      
      setUploading(fileId, 'success')
      
      // Store upload result
      setUploadedFiles(prev => new Map(prev).set(index, {
        ...response,
        originalFile: file
      }))

      // Simple success message without compression details
      toast.success('File uploaded successfully!')

      // Clear upload status after delay
      setTimeout(() => {
        setUploading(fileId, null)
      }, 2000)

      return response
    } catch (error) {
      setUploading(fileId, 'error')
      toast.error(`Upload failed: ${error.message}`)
      
      // Clear error status after delay
      setTimeout(() => {
        setUploading(fileId, null)
      }, 3000)
      
      throw error
    }
  }

  // This function handles the file drop event
  const onDrop = useCallback(
    async (acceptedFiles) => { 
      const newFiles = [...files]

      // Add files up to the limit
      const filesToAdd = acceptedFiles.slice(0, maxFiles - newFiles.length)
      
      filesToAdd.forEach((file) => {
        newFiles.push(file)
      })

      if (acceptedFiles.length > filesToAdd.length) {
        toast.warning(`Only ${maxFiles} files allowed. ${acceptedFiles.length - filesToAdd.length} files were ignored.`)
      }

      setFiles(newFiles)
      onChange(newFiles)

      // Auto-upload if enabled
      if (autoUpload) {
        const startIndex = files.length
        for (let i = 0; i < filesToAdd.length; i++) {
          try {
            await uploadFile(filesToAdd[i], startIndex + i)
          } catch (error) {
            console.error(`Failed to upload ${filesToAdd[i].name}:`, error)
          }
        }
      }
    },
    [files, maxFiles, onChange, setFiles, autoUpload], 
  )

  // This function handles the file removal event
  const removeFile = (index) => {
    removeFileByIndex(index)
    setUploadedFiles(prev => {
      const newMap = new Map(prev)
      newMap.delete(index)
      return newMap
    })
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index)
    onChange(updatedFiles)
  }

  // Manual upload function
  const uploadAllFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFile(files[i], i)
      } catch (error) {
        console.error(`Failed to upload ${files[i].name}:`, error)
      }
    }
  }

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
  })

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
          {acceptedFileTypes && (
            <p className="text-xs text-gray-400">
              Accepted: {acceptedFileTypes.replace(/\*/g, 'all types')}
            </p>
          )}
        </div>
      </div>

      {/* Manual upload button for non-auto upload */}
      {!autoUpload && files.length > 0 && (
        <div className="flex justify-center">
          <Button 
            onClick={uploadAllFiles}
            className="bg-amber-700 hover:bg-amber-800 text-white"
            disabled={Array.from(uploadingFiles.values()).some(status => status === 'uploading')}
          >
            {Array.from(uploadingFiles.values()).some(status => status === 'uploading') ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* File list display */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Files ({files.length}/{maxFiles})
          </h4>
          {files.map((file, index) => {
            const fileId = `${file.name}-${file.lastModified}`
            const uploadStatus = uploadingFiles.get(fileId)
            const uploadResult = uploadedFiles.get(index)
            
            return (
              <div key={fileId} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 truncate flex-1">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <UploadStatus status={uploadStatus} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {uploadResult ? formatFileSize(uploadResult.size) : formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removeFile(index)} 
                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  disabled={uploadStatus === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}