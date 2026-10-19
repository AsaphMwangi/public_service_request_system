'use client'

import { useState, FormEvent } from 'react'
import { auth } from '@/lib/firebase'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

interface FormData {
  category: string
  location: string
  description: string
  imageUrl: string
}

export default function SubmitRequest() {
  const [formData, setFormData] = useState<FormData>({
    category: '',
    location: '',
    description: '',
    imageUrl: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const user = auth.currentUser
      if (!user) {
        toast.error('Please login first to submit a request')
        setIsLoading(false)
        return
      }

      const payload = {
        ...formData,
        userId: user.uid,
        userEmail: user.email
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Service request submitted successfully')
        setFormData({ category: '', location: '', description: '', imageUrl: '' })
      } else {
        toast.error('Failed to submit your request')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 relative">
      <Toaster />
      
      <div className="absolute top-4 right-4 space-x-4">
        <Link href="/my-requests" className="text-green-700 font-bold hover:text-green-900 transition">
          View My Requests
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-green-600">
        <h1 className="text-2xl font-bold text-green-800 mb-6">Submit Service Request</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-700 font-medium mb-1">Category</label>
            <select 
              className="w-full border border-green-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
              disabled={isLoading}
            >
              <option value="">Select Category</option>
              <option value="Water">Water Issue</option>
              <option value="Roads">Broken Streetlight / Roads</option>
              <option value="Garbage">Garbage Collection</option>
            </select>
          </div>

          <div>
            <label className="block text-green-700 font-medium mb-1">Location</label>
            <input 
              type="text"
              className="w-full border border-green-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-green-700 font-medium mb-1">Description</label>
            <textarea 
              className="w-full border border-green-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}