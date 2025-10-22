'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image as ImageIcon, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Upload to Cloudinary
  const uploadImage = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, WebP)')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 10MB')
      return
    }

    setUploading(true)
    const uploadToast = toast.loading('Uploading image to Cloudinary...')

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'token-images')

      console.log('📤 Uploading to Cloudinary...')
      console.log('Cloud name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('Cloudinary error:', error)
        throw new Error(error.error?.message || 'Upload failed')
      }

      const data = await response.json()
      const imageUrl = data.secure_url

      console.log('✅ Image uploaded successfully!')
      console.log('URL:', imageUrl)
      console.log('Public ID:', data.public_id)

      // Update form with new URL
      onChange(imageUrl)

      toast.success('Image uploaded successfully!', { id: uploadToast })
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      toast.error(error.message || 'Failed to upload image', { id: uploadToast })
    } finally {
      setUploading(false)
    }
  }

  // ✅ Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  // ✅ Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  // ✅ Clear image
  const clearImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ✅ Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      {value && (
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-purple-300 dark:border-purple-600 shadow-lg">
          <Image
            src={value}
            alt="Token image preview"
            fill
            className="object-cover"
            unoptimized
            onError={() => {
              toast.error('Failed to load image')
              onChange('')
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={clearImage}
              disabled={disabled || uploading}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`relative border-2 border-dashed rounded-lg p-8 transition cursor-pointer ${
            dragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                <p className="text-sm font-medium">Uploading to Cloudinary...</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">Drop your image here or click to browse</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF, WebP • Max 10MB</p>
                </div>
                <button
                  type="button"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Choose File
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* OR Divider */}
      {!value && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          <span className="text-sm text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        </div>
      )}

      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Paste Image URL</label>
        <input
          type="url"
          placeholder="https://i.imgur.com/example.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-medium text-blue-900 dark:text-blue-100">Image Tips:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Square images (1:1 ratio) work best</li>
              <li>• Minimum 400x400px recommended</li>
              <li>• Images are stored on Cloudinary (CDN)</li>
            </ul>
            <a
              href="https://imgur.com/upload"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium mt-2"
            >
              Or upload to Imgur <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
