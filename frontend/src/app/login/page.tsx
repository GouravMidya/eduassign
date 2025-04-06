"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { initializeFirebase, signIn, signUp } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Loader2, LogIn, UserPlus, Info, X } from "lucide-react"

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [userType, setUserType] = useState("student")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const defaultTab = searchParams?.get("tab") === "register" ? "register" : "login"
  const [infoVisible, setInfoVisible] = useState(true)

  // Initialize Firebase when component mounts
  useEffect(() => {
    initializeFirebase()
    setActiveTab(defaultTab)
  }, [defaultTab])

  // Set default credentials based on user type only for login tab
  useEffect(() => {
    if (activeTab === "login") {
      if (userType === "student") {
        setLoginEmail("gourav@gmail.com")
        setLoginPassword("123456")
      } else {
        setLoginEmail("ggmidya@gmail.com")
        setLoginPassword("123456")
      }
    }
  }, [userType, activeTab])

  const handleAuth = async (isLogin: boolean) => {
    const email = isLogin ? loginEmail : registerEmail
    const password = isLogin ? loginPassword : registerPassword

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!isLogin && !document.getElementById("register-name")?.value) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        toast({
          title: "Success",
          description: "Logged in successfully",
        })
      } else {
        const name = (document.getElementById("register-name") as HTMLInputElement).value
        await signUp(email, password, userType, name)
        toast({
          title: "Success",
          description: "Account created successfully",
        })
      }

      // Redirect based on user type
      if (userType === "teacher") {
        router.push("/teacher/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-primary">EduAssign</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full" onValueChange={handleTabChange}>
                {infoVisible && activeTab === "login" && (
                  <motion.div
                    className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <div className="text-blue-500 mr-2 mt-0.5">
                          <Info className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-blue-800 dark:text-blue-200">
                            Credentials are prefilled for guided demo purposes.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setInfoVisible(false)}
                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="transition-all focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button variant="link" className="p-0 h-auto text-xs">
                          Forgot password?
                        </Button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="transition-all focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userType">I am a</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={userType === "student" ? "default" : "outline"}
                          onClick={() => setUserType("student")}
                          className="flex-1 transition-all"
                        >
                          Student
                        </Button>
                        <Button
                          type="button"
                          variant={userType === "teacher" ? "default" : "outline"}
                          onClick={() => setUserType("teacher")}
                          className="flex-1 transition-all"
                        >
                          Teacher
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full btn-hover" onClick={() => handleAuth(true)} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </motion.div>
                </TabsContent>

                <TabsContent value="register">
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        placeholder="Enter your full name"
                        className="transition-all focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="transition-all focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="transition-all focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userType">I am a</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={userType === "student" ? "default" : "outline"}
                          onClick={() => setUserType("student")}
                          className="flex-1 transition-all"
                        >
                          Student
                        </Button>
                        <Button
                          type="button"
                          variant={userType === "teacher" ? "default" : "outline"}
                          onClick={() => setUserType("teacher")}
                          className="flex-1 transition-all"
                        >
                          Teacher
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full btn-hover" onClick={() => handleAuth(false)} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}