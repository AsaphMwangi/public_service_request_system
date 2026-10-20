'use client'

import { useEffect, useState, FormEvent } from 'react'
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
  imageUrl?: string
}

interface ModeratorItem {
  _id: string
  email: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [moderators, setModerators] = useState<ModeratorItem[]>([])
  const [newModEmail, setNewModEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          setIsMainAdmin(true)
          setIsAuthenticated(true)
          fetchRequests()
          fetchModerators()
        } else {
          try {
            const res = await fetch('/api/moderators')
            const data = await res.json()
            const isMod = data.success && data.data.some((mod: any) => mod.email === user.email)
            
            if (isMod) {
              setIsMainAdmin(false) // Explicitly hide the panel for moderators
              setIsAuthenticated(true)
              fetchRequests()
            } else {
              toast.error('Unauthorized access')
              router.push('/my-requests')
            }
          } catch (error) {
            router.push('/my-requests')
          }
        }
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests')
      const data = await res.json()
      if (data.success) {
        setRequests(data.data)
      }
    } finally {
      setIsInitialLoading(false)
    }
  }

  const fetchModerators = async () => {
    const res = await fetch('/api/moderators')
    const data = await res.json()
    if (data.success) {
      setModerators(data.data)
    }
  }

  const handleAddModerator = async (e: FormEvent) => {
    e.preventDefault()
    const currentUser = auth.currentUser
    
    const res = await fetch('/api/moderators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: newModEmail,
        requesterEmail: currentUser?.email 
      })
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      toast.success('Moderator added successfully')
      setNewModEmail('')
      fetchModerators()
    } else {
      // This will now dynamically display the "Cannot add moderator..." error from the API
      toast.error(data.error || 'Failed to add moderator')
    }
  }

  const handleRemoveModerator = async (id: string) => {
    const currentUser = auth.currentUser
    
    const res = await fetch(`/api/moderators?id=${id}&requesterEmail=${currentUser?.email}`, {
      method: 'DELETE'
    })
    
    if (res.ok) {
      toast.success('Moderator removed successfully')
      fetchModerators()
    } else {
      toast.error('Failed to remove moderator: Unauthorized')
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
              <th className="p-4">Photo</th>
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
                  {request.imageUrl ? (
                 <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-semibold">
                <img src={request.imageUrl} alt="Issue" className="h-12 w-16 object-cover rounded border border-green-300" />
                  </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No Photo</span>
                      )}
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

  const resolvedCases = requests.filter(r => r.status === 'Resolved').length
  const openCases = requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const totalCases = requests.length
  const resolvedPercentage = totalCases === 0 ? 0 : Math.round((resolvedCases / totalCases) * 100)

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
          Logout
        </button>
      </div>

      {isInitialLoading ? (
        <div className="flex justify-center items-center py-32">
          <svg className="animate-spin h-16 w-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {isMainAdmin && (
            <div className="bg-white p-6 rounded-lg shadow mb-12 border-t-4 border-yellow-500">
              <h2 className="text-xl font-bold text-green-900 mb-4">Manage System Moderators</h2>
              <form onSubmit={handleAddModerator} className="flex gap-4 mb-6">
                <input 
                  type="email" 
                  placeholder="Enter email to grant moderator access" 
                  className="flex-1 border border-green-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newModEmail}
                  onChange={(e) => setNewModEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bg-yellow-600 text-white font-bold py-2 px-6 rounded hover:bg-yellow-700 transition">
                  Add Moderator
                </button>
              </form>
              
              {moderators.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moderators.map(mod => (
                    <div key={mod._id} className="bg-green-50 p-4 rounded border border-green-200 flex justify-between items-center shadow-sm">
                      <span className="text-green-800 font-medium truncate pr-2">{mod.email}</span>
                      <button 
                        onClick={() => handleRemoveModerator(mod._id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-900 font-semibold py-1 px-3 rounded transition text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow mb-12 border-t-4 border-green-700">
            <h2 className="text-xl font-bold text-green-900 mb-6">Service Request Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                <p className="text-sm font-bold text-green-600 uppercase tracking-wide">Total Requests</p>
                <p className="text-4xl font-extrabold text-green-900 mt-2">{totalCases}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
                <p className="text-sm font-bold text-yellow-600 uppercase tracking-wide">Open Cases</p>
                <p className="text-4xl font-extrabold text-yellow-900 mt-2">{openCases}</p>
              </div>
              <div className="bg-green-100 p-6 rounded-lg border border-green-300 text-center">
                <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Resolved Cases</p>
                <p className="text-4xl font-extrabold text-green-900 mt-2">{resolvedCases}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold text-green-800 mb-2">
                <span>Resolution Progress</span>
                <span>{resolvedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full transition-all duration-500" 
                  style={{ width: `${resolvedPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-yellow-600 mb-4 border-b-2 border-yellow-200 pb-2">Pending</h2>
          {renderTable('Pending')}

          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">Currently In Progress</h2>
          {renderTable('In Progress')}

          <h2 className="text-2xl font-bold text-green-700 mb-4 border-b-2 border-green-200 pb-2">Resolved Issues</h2>
          {renderTable('Resolved')}
        </>
      )}
    </div>
  )
}