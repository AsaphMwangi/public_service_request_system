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
  status: string
  description: string
  createdAt: string
}

export default function MyRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        fetchMyRequests(user.uid)
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchMyRequests = async (userId: string) => {
    const res = await fetch(`/api/requests?userId=${userId}`)
    const data = await res.json()
    if (data.success) {
      setRequests(data.data)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-900">My Service Requests</h1>
          <div className="space-x-4">
            <Link href="/submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              New Request
            </Link>
            <button onClick={() => auth.signOut()} className="text-green-700 border border-green-600 px-4 py-2 rounded hover:bg-green-100">
              Logout
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-green-800">
            You have not submitted any service requests yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <div key={request._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-green-800">{request.category}</h3>
                    <p className="text-green-600">{request.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    request.status === 'Resolved' ? 'bg-green-200 text-green-800' :
                    request.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{request.description}</p>
                <p className="text-sm text-green-500">
                  Submitted on {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}