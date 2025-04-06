"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes: string[]
}

export default function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, userType, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (!isLoading && user && userType && !allowedUserTypes.includes(userType)) {
      // Redirect to appropriate dashboard based on user type
      if (userType === "teacher") {
        router.push("/teacher/dashboard")
      } else if (userType === "student") {
        router.push("/student/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, userType, isLoading, router, allowedUserTypes])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!user || !userType || !allowedUserTypes.includes(userType)) {
    return null
  }

  return <>{children}</>
}

