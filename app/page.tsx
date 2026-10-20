'use client'

import { useState, FormEvent } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
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
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email)
        toast.success('Password reset email sent! Check your inbox.')
        setIsForgotPassword(false)
        setIsLogin(true)
      } else if (isLogin) {
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
    } finally {
      setIsLoading(false)
      if (!isForgotPassword) {
        setPassword('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <Toaster />
      
      <div className="mb-6 text-center px-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-green-800 dark:text-green-400 mb-2">
          Muranga County eCitizen
        </h1>
        <p className="text-sm sm:text-base text-green-700 dark:text-gray-300">
          Public Service Request Portal
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-green-600 dark:border-green-500">
        <h2 className="text-xl sm:text-2xl font-bold text-green-800 dark:text-white mb-6 text-center">
          {isForgotPassword ? 'Reset Password' : (isLogin ? 'Citizen Login' : 'Register Account')}
        </h2>
        
        <form onSubmit={handleAuthentication} className="space-y-5">
          <div>
            <label className="block text-green-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">
              Email Address
            </label>
            <input 
              type="email"
              placeholder="Enter your email address"
              className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-green-800 dark:text-gray-200 font-semibold mb-1 text-sm sm:text-base">
                Password
              </label>
              <input 
                type="password"
                placeholder="Enter your password"
                className="w-full border border-green-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 dark:bg-green-700 text-white font-bold py-3 px-4 rounded hover:bg-green-700 dark:hover:bg-green-600 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Sign Up'))}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {isLogin && !isForgotPassword && (
            <button 
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline block w-full py-1 font-semibold"
            >
              Forgot your password?
            </button>
          )}

          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault()
              if (!isLoading) {
                setIsForgotPassword(false)
                setIsLogin(!isLogin)
              }
            }}
            disabled={isLoading}
            className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-semibold transition duration-200 disabled:opacity-50 block w-full py-2"
          >
            {isForgotPassword 
              ? 'Back to Login' 
              : (isLogin ? 'Need an account? Register here' : 'Already have an account? Login here')}
          </button>
        </div>
      </div>
    </div>
  )
}