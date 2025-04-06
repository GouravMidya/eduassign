"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LogOut, User, Home, FileText, Users, MessageSquare, Menu, ChevronLeft, ChevronRight, Bell } from "lucide-react"
import { signOut } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "teacher" | "student"
}

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const isTeacher = userType === "teacher"
  const dashboardPath = isTeacher ? "/teacher/dashboard" : "/student/dashboard"
  const assignmentsPath = isTeacher ? "/teacher/assignments" : "/student/assignments"
  const router = useRouter()
  const pathname = usePathname()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(isTeacher ? 3 : 2)

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize() // Initial check
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: dashboardPath,
    },
    {
      title: "Assignments",
      icon: FileText,
      href: assignmentsPath,
    },
    ...(isTeacher
      ? [
          {
            title: "Submissions",
            icon: Users,
            href: "/teacher/submissions",
            badge: 7,
          },
        ]
      : [
          {
            title: "My Feedback",
            icon: MessageSquare,
            href: "/student/feedback",
          },
        ]),
  ]

  const sidebarVariants = {
    open: { width: 256, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { width: 80, transition: { duration: 0.3, ease: "easeInOut" } },
  }

  const mobileMenuVariants = {
    open: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { x: "-100%", transition: { duration: 0.3, ease: "easeInOut" } },
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        className="border-b bg-card z-10 sticky top-0 shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href={dashboardPath} className="text-xl font-bold text-primary">
              EduAssign
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isTeacher ? (
                  <>
                    <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="font-medium">New submission received</div>
                      <div className="text-sm text-muted-foreground">Student ID: 1234 submitted Assignment #3</div>
                      <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="font-medium">Feedback ready for review</div>
                      <div className="text-sm text-muted-foreground">AI evaluation completed for 2 submissions</div>
                      <div className="text-xs text-muted-foreground mt-1">15 minutes ago</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="font-medium">System update</div>
                      <div className="text-sm text-muted-foreground">New features available in the feedback system</div>
                      <div className="text-xs text-muted-foreground mt-1">1 day ago</div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="font-medium">Feedback available</div>
                      <div className="text-sm text-muted-foreground">
                        Your submission for Assignment #2 has been evaluated
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">5 minutes ago</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="font-medium">New assignment posted</div>
                      <div className="text-sm text-muted-foreground">
                        Check out the new assignment on Data Structures
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-primary cursor-pointer">
                  Mark all as read
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">Help & Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r pt-16 md:hidden"
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={pathname === item.href ? "default" : "ghost"}
                      className="w-full justify-start relative"
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.title}
                        {item.badge && <Badge className="ml-auto bg-primary">{item.badge}</Badge>}
                      </Link>
                    </Button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.aside
          className="hidden md:block border-r bg-sidebar text-sidebar-foreground relative"
          variants={sidebarVariants}
          initial={isSidebarOpen ? "open" : "closed"}
          animate={isSidebarOpen ? "open" : "closed"}
        >
          <nav className="p-4 space-y-2 sticky top-16">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn("w-full justify-start relative group", !isSidebarOpen && "px-2")}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="transition-opacity duration-200"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && isSidebarOpen && <Badge className="ml-auto bg-primary">{item.badge}</Badge>}
                  {item.badge && !isSidebarOpen && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}

            {/* Toggle sidebar button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full border bg-card shadow-sm z-10"
            >
              {isSidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </nav>
        </motion.aside>

        {/* Main content */}
        <motion.main
          className="flex-1 p-6 bg-background"
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          key={pathname}
        >
          <div className="container mx-auto">{children}</div>
        </motion.main>
      </div>
    </div>
  )
}

