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
  description?: string
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
              setIsMainAdmin(false)
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
      return <p className="text-green-800 dark:text-gray-300 py-4 mb-8">No requests currently in this stage.</p>
    }

    return (
      <div className="mb-12">
        {/* Mobile View: Stacked Cards showing all fields clearly */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filtered.map(request => (
            <div key={request._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-green-200 dark:border-gray-700 space-y-3">
              <div className="flex justify-between items-start border-b border-green-100 dark:border-gray-700 pb-2">
                <div>
                  <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block">Category</span>
                  <span className="font-bold text-gray-900 dark:text-white text-base">{request.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block">Date</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block">Location</span>
                <span className="text-sm text-gray-900 dark:text-gray-200 break-words">{request.location}</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block">Citizen Email</span>
                <span className="text-sm text-gray-900 dark:text-gray-200 break-all">{request.userEmail}</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block mb-1">Evidence Photo</span>
                {request.imageUrl ? (
                  <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                    <img src={request.imageUrl} alt="Issue" className="h-32 w-full object-cover rounded border border-green-300 dark:border-gray-600" />
                  </a>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">No Photo Attached</span>
                )}
              </div>

              <div className="pt-2 border-t border-green-100 dark:border-gray-700">
                <label className="text-xs font-bold uppercase text-green-600 dark:text-green-400 block mb-1">
                  Modify Status
                </label>
                <div className="flex items-center space-x-3">
                  <select 
                    className="w-full border border-green-400 dark:border-gray-600 bg-white dark:bg-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-medium disabled:opacity-50"
                    value={request.status}
                    onChange={(e) => updateStatus(request._id, e.target.value)}
                    disabled={updatingId === request._id}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  {updatingId === request._id && (
                    <svg className="animate-spin h-5 w-5 text-green-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Citizen Email</th>
                <th className="p-4">Date Submitted</th>
                <th className="p-4">Photo</th>
                <th className="p-4">Modify Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(request => (
                <tr key={request._id} className="border-b border-green-100 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 text-gray-900 dark:text-gray-100 font-medium">{request.category}</td>
                  <td className="p-4 text-gray-800 dark:text-gray-200">{request.location}</td>
                  <td className="p-4 text-gray-800 dark:text-gray-200">{request.userEmail}</td>
                  <td className="p-4 text-gray-800 dark:text-gray-200">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {request.imageUrl ? (
                      <a href={request.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={request.imageUrl} alt="Issue" className="h-12 w-16 object-cover rounded border border-green-300 dark:border-gray-600" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No Photo</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <select 
                        className="border border-green-400 dark:border-gray-600 bg-white dark:bg-gray-700 rounded p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-medium disabled:opacity-50"
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
      </div>
    )
  }

  const resolvedCases = requests.filter(r => r.status === 'Resolved').length
  const openCases = requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const totalCases = requests.length
  const resolvedPercentage = totalCases === 0 ? 0 : Math.round((resolvedCases / totalCases) * 100)

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 p-4 sm:p-8 transition-colors duration-200">
      <Toaster />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-700">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-400 text-center sm:text-left">
          County Admin Dashboard
        </h1>
        <button 
          type="button"
          onClick={() => auth.signOut()} 
          className="w-full sm:w-auto bg-red-600 text-white font-semibold px-5 py-2.5 rounded hover:bg-red-700 transition"
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
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-8 sm:mb-12 border-t-4 border-yellow-500">
              <h2 className="text-lg sm:text-xl font-bold text-green-900 dark:text-white mb-4">
                Manage System Moderators
              </h2>
              <form onSubmit={handleAddModerator} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  type="email" 
                  placeholder="Enter email to grant moderator access" 
                  className="flex-1 border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newModEmail}
                  onChange={(e) => setNewModEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-yellow-600 text-white font-bold py-3 px-6 rounded hover:bg-yellow-700 transition"
                >
                  Add Moderator
                </button>
              </form>
              
              {moderators.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {moderators.map(mod => (
                    <div key={mod._id} className="bg-green-50 dark:bg-gray-700 p-3 sm:p-4 rounded border border-green-200 dark:border-gray-600 flex justify-between items-center gap-2 shadow-sm">
                      <span className="text-gray-900 dark:text-white font-medium text-sm break-all">{mod.email}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveModerator(mod._id)}
                        className="bg-red-600 text-white hover:bg-red-700 font-semibold py-1.5 px-3 rounded transition text-xs shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-8 sm:mb-12 border-t-4 border-green-700">
            <h2 className="text-lg sm:text-xl font-bold text-green-900 dark:text-white mb-4 sm:mb-6">
              Service Request Analytics
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg border border-green-200 dark:border-gray-600 text-center">
                <p className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Total Requests</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-green-900 dark:text-white mt-1">{totalCases}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg border border-yellow-200 dark:border-gray-600 text-center">
                <p className="text-xs sm:text-sm font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Open Cases</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-yellow-900 dark:text-white mt-1">{openCases}</p>
              </div>
              <div className="bg-green-100 dark:bg-gray-700 p-4 sm:p-6 rounded-lg border border-green-300 dark:border-gray-600 text-center">
                <p className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">Resolved Cases</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-green-900 dark:text-white mt-1">{resolvedCases}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold text-green-800 dark:text-gray-200 mb-2">
                <span>Resolution Progress</span>
                <span>{resolvedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full transition-all duration-500" 
                  style={{ width: `${resolvedPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4 border-b-2 border-yellow-200 dark:border-yellow-700 pb-2">
            Pending Triage
          </h2>
          {renderTable('Pending')}

          <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
            Currently In Progress
          </h2>
          {renderTable('In Progress')}

          <h2 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4 border-b-2 border-green-200 dark:border-green-700 pb-2">
            Resolved Issues
          </h2>
          {renderTable('Resolved')}
        </>
      )}
    </div>
  )
}