'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RequestItem {
  _id: string
  category: string
  location: string
  description: string
  status: string
  createdAt: number
  imageUrl?: string
}

export default function MyRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRequests(user.uid)
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchUserRequests = async (userId: string) => {
    try {
      const res = await fetch(`/api/requests?userId=${userId}`)
      const data = await res.json()
      if (data.success) {
        setRequests(data.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Resolved') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300'
    }
    if (status === 'In Progress') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300'
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300'
  }

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 p-4 sm:p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-400 text-center sm:text-left">
            My Service Requests
          </h1>
          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
            <Link 
              href="/submit" 
              className="bg-green-600 text-white text-center font-semibold px-4 py-2.5 rounded hover:bg-green-700 transition text-sm sm:text-base"
            >
              + New Request
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

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <svg className="animate-spin h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
            <p className="text-green-800 dark:text-gray-200 text-lg mb-4">You have not submitted any service requests yet.</p>
            <Link href="/submit" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded hover:bg-green-700 transition">
              Submit Your First Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((request) => (
              <div key={request._id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border-l-4 border-green-600 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-lg font-bold text-green-900 dark:text-white">
                      {request.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <strong className="text-green-800 dark:text-green-400">Location:</strong> {request.location}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="text-green-800 dark:text-green-400">Description:</strong> {request.description}
                  </p>

                  {request.imageUrl && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-1">Attached Evidence:</p>
                      <a href={request.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={request.imageUrl} 
                          alt={request.category} 
                          className="w-full h-48 object-cover rounded border border-green-200 dark:border-gray-700"
                        />
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Submitted on:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}