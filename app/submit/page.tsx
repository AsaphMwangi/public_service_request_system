'use client'

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function SubmitRequest() {
  const [user, setUser] = useState<User | null>(null)
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/')
      }
    })
    return () => {
      stopCameraStream()
      unsubscribe()
    }
  }, [router])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      stopCameraStream()
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mobileCameraInputRef.current?.click()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      })
      streamRef.current = stream
      setIsCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      toast.error('Camera permission denied or unavailable. Opening default picker.')
      mobileCameraInputRef.current?.click()
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setImageFile(capturedFile)
          setImagePreview(URL.createObjectURL(capturedFile))
          stopCameraStream()
        }
      }, 'image/jpeg', 0.85)
    }
  }

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const clearSelectedImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!category) {
      toast.error('Please choose a service category')
      return
    }

    setIsSubmitting(true)

    try {
      let uploadedImageUrl = ''

      if (imageFile) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(imageFile.name)}`, {
          method: 'POST',
          body: imageFile
        })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload image')
        }
        uploadedImageUrl = uploadData.url
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          location,
          description,
          imageUrl: uploadedImageUrl,
          userId: user.uid,
          userEmail: user.email
        })
      })

      if (res.ok) {
        toast.success('Service request submitted successfully')
        setCategory('')
        setLocation('')
        setDescription('')
        clearSelectedImage()
        router.push('/my-requests')
      } else {
        toast.error('Failed to submit service request')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during submission')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors duration-200">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-400 text-center sm:text-left">
            Report an Issue
          </h1>
          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
            <Link 
              href="/my-requests" 
              className="bg-green-700 text-white text-center font-semibold px-4 py-2.5 rounded hover:bg-green-800 transition text-sm sm:text-base"
            >
              View My Requests
            </Link>
            <button 
              type="button"
              onClick={() => auth.signOut()} 
              className="bg-red-600 text-white font-semibold px-4 py-2.5 rounded hover:bg-red-700 transition text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-lg shadow-md border-t-4 border-green-600 space-y-6">
          <div>
            <label className="block text-green-800 dark:text-gray-200 font-bold mb-2 text-sm sm:text-base">
              Service Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              <option value="" disabled>Choose Category</option>
              <option value="Roads & Transport">Roads & Transport</option>
              <option value="Water & Sanitation">Water & Sanitation</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Street Lighting">Street Lighting</option>
              <option value="Public Health">Public Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-green-800 dark:text-gray-200 font-bold mb-2 text-sm sm:text-base">
              Specific Location / Ward
            </label>
            <input
              type="text"
              placeholder="e.g. Mukuyu Market, Kiharu"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-green-800 dark:text-gray-200 font-bold mb-2 text-sm sm:text-base">
              Issue Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-green-800 dark:text-gray-200 font-bold mb-2 text-sm sm:text-base">
              Attach Evidence Photo (Optional)
            </label>
            
            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={mobileCameraInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full bg-green-100 dark:bg-gray-700 text-green-900 dark:text-green-300 font-semibold py-3 px-4 rounded border border-green-400 dark:border-gray-600 hover:bg-green-200 dark:hover:bg-gray-600 transition"
              >
                Choose from Gallery
              </button>

              <button
                type="button"
                onClick={startCamera}
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded hover:bg-green-700 transition"
              >
                Take a Picture
              </button>
            </div>

            {isCameraOpen && (
              <div className="bg-black p-3 sm:p-4 rounded-lg mb-4 text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-80 object-cover rounded mb-4"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-yellow-500 text-black font-bold py-2.5 px-4 rounded hover:bg-yellow-400 transition"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="bg-red-600 text-white font-bold py-2.5 px-4 rounded hover:bg-red-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="relative mt-4 border border-green-300 dark:border-gray-600 rounded-lg p-3 bg-green-50 dark:bg-gray-700">
                <p className="text-sm font-semibold text-green-800 dark:text-gray-200 mb-2">Attached Photo Preview:</p>
                <img
                  src={imagePreview}
                  alt="Issue Preview"
                  className="w-full max-h-64 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="mt-3 w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition"
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-700 text-white font-bold py-3.5 px-6 rounded hover:bg-green-800 transition flex items-center justify-center disabled:opacity-60"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Uploading & Submitting...' : 'Submit Service Request'}
          </button>
        </form>
      </div>
    </div>
  )
}