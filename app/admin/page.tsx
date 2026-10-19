'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface RequestItem {
  _id: string
  category: string
  location: string
  status: string
  createdAt: string
  userEmail: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        fetchRequests()
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchRequests = async () => {
    const res = await fetch('/api/requests')
    const data = await res.json()
    if (data.success) {
      setRequests(data.data)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`)
        await fetchRequests()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setUpdatingId(null)
    }
  }

  const renderTable = (statusFilter: string) => {
    const filtered = requests.filter(r => r.status === statusFilter)
    
    if (filtered.length === 0) {
      return <p className="text-green-700 py-4 mb-8">No requests currently in this stage.</p>
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Citizen Email</th>
              <th className="p-4">Date Submitted</th>
              <th className="p-4">Modify Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(request => (
              <tr key={request._id} className="border-b border-green-100 hover:bg-green-50">
                <td className="p-4 text-green-800">{request.category}</td>
                <td className="p-4 text-green-800">{request.location}</td>
                <td className="p-4 text-green-800">{request.userEmail}</td>
                <td className="p-4 text-green-800">
                  {new Date(request.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <select 
                      className="border border-green-400 bg-white rounded p-2 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      value={request.status}
                      onChange={(e) => updateStatus(request._id, e.target.value)}
                      disabled={updatingId === request._id}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    {updatingId === request._id && (
                      <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-900">County Admin Dashboard</h1>
        <button 
          onClick={() => auth.signOut()} 
          className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-900 transition"
        >
          Admin Logout
        </button>
      </div>

      <h2 className="text-2xl font-bold text-yellow-600 mb-4 border-b-2 border-yellow-200 pb-2">Pending Triage</h2>
      {renderTable('Pending')}

      <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">Currently In Progress</h2>
      {renderTable('In Progress')}

      <h2 className="text-2xl font-bold text-green-700 mb-4 border-b-2 border-green-200 pb-2">Resolved Issues</h2>
      {renderTable('Resolved')}
    </div>
  )
}