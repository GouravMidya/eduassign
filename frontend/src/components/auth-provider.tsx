"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChange, getFirebaseAuth, initializeFirebase } from "@/lib/firebase"
import { doc, getDoc, getFirestore } from "firebase/firestore"

// Define the auth context type
type AuthContextType = {
  user: User | null
  userType: string | null
  userName: string | null
  isLoading: boolean
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  userName: null,
  isLoading: true,
})

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Initialize Firebase Auth
    initializeFirebase()
    const auth = getFirebaseAuth()
    const db = getFirestore()

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setIsLoading(true)

      if (authUser) {
        setUser(authUser)

        // Get user type from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", authUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserType(userData.userType)
            setUserName(userData.name || null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUser(null)
        setUserType(null)
        setUserName(null)

        // Redirect to login if accessing protected routes
        if (pathname?.startsWith("/teacher") || pathname?.startsWith("/student")) {
          router.push("/login")
        }
      }

      setIsLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [pathname, router])

  return <AuthContext.Provider value={{ user, userType, userName, isLoading }}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext)

