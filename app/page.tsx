'use client'

import { useState, FormEvent } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const checkRoleAndRedirect = async (userEmail: string | null) => {
    if (userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.push('/admin')
      return
    }

    try {
      const res = await fetch('/api/moderators')
      const data = await res.json()
      const isModerator = data.success && data.data.some((mod: any) => mod.email === userEmail)

      if (isModerator) {
        router.push('/admin')
      } else {
        router.push('/submit')
      }
    } catch (error) {
      router.push('/submit')
    }
  }

  const handleAuthentication = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        toast.success('Login successful')
        await checkRoleAndRedirect(email)
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          createdAt: Date.now()
        })

        toast.success('Registration successful')
        await checkRoleAndRedirect(email)
      }
    } catch (error: any) {
      toast.error(error.message)
      setIsLoading(false)
    } finally {
      setIsLoading(false)
      setEmail('')
      setPassword('')
    }
  }

  return (
   
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <Toaster />
      
      
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-green-800 dark:text-green-400 mb-2">Muranga County</h1>
        <p className="text-green-600 dark:text-gray-300">Public Service Request Portal</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-green-600 dark:border-green-500">
        <h2 className="text-2xl font-bold text-green-800 dark:text-white mb-6 text-center">
          {isLogin ? 'Citizen Login' : 'Register Account'}
        </h2>
        
        <form onSubmit={handleAuthentication} className="space-y-5">
          <div>
            <label className="block text-green-700 dark:text-gray-200 font-medium mb-1">Email Address</label>
            <input 
              type="email"
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-green-700 dark:text-gray-200 font-medium mb-1">Password</label>
            <input 
              type="password"
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 dark:bg-green-700 text-white font-bold py-2 px-4 rounded hover:bg-green-700 dark:hover:bg-green-600 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault()
              if (!isLoading) setIsLogin(!isLogin)
            }}
            disabled={isLoading}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium transition duration-200 disabled:opacity-50 block w-full py-2"
          >
            {isLogin ? 'Need an account? Register here' : 'Already have an account? Login here'}
          </button>
        </div>
      </div>
    </div>
  )
}