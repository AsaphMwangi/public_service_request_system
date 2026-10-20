'use client'

import { useEffect, useState, FormEvent } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
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

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user || !user.email) return

    setIsUpdatingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      toast.success('Password updated successfully')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password. Check current password.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const user = auth.currentUser
    if (!user || !user.email) return

    const pwd = prompt('Enter your current password to confirm account deletion:')
    if (!pwd) return

    try {
      const credential = EmailAuthProvider.credential(user.email, pwd)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account. Incorrect password.')
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
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 p-4 sm:p-8 flex flex-col justify-between transition-colors duration-200">
      <Toaster />
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-400 text-center sm:text-left">
            My Service Requests
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link 
              href="/submit" 
              className="bg-green-600 text-white font-semibold px-3.5 py-2 rounded hover:bg-green-700 transition text-sm"
            >
              + New Request
            </Link>
            <button 
              type="button"
              onClick={() => setShowPasswordModal(true)} 
              className="bg-yellow-600 text-white font-semibold px-3.5 py-2 rounded hover:bg-yellow-700 transition text-sm"
            >
              Change Password
            </button>
            <button 
              type="button"
              onClick={handleDeleteAccount} 
              className="bg-red-600 text-white font-semibold px-3.5 py-2 rounded hover:bg-red-700 transition text-sm"
            >
              Delete Account
            </button>
            <button 
              type="button"
              onClick={() => auth.signOut()} 
              className="border border-green-700 text-green-800 dark:text-green-300 font-semibold px-3.5 py-2 rounded hover:bg-green-100 dark:hover:bg-gray-700 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-lg border-t-4 border-yellow-500">
              <h2 className="text-xl font-bold text-green-900 dark:text-white mb-4">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

      <footer className="mt-12 text-center text-sm text-green-800 dark:text-gray-400 py-4 border-t border-green-200 dark:border-gray-800">
        <p>&copy; 2026 Murang'a County eCitizen Portal. All rights reserved. | <a href="https://publicservicerequestsystem.asaphmwangi.site/privacypolicy.html" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-green-600">Privacy Policy</a></p>
      </footer>
    </div>
  )
}