"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI, submissionAPI } from "@/lib/api"
import { Search, User, ArrowRight, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface Submission {
  id: string
  student_id: string
  assignment_id: string
  submitted_at: string
  status: string
  ai_processing_status: string
  feedback_status?: string
  overall_marks?: number
  max_possible_marks?: number
  assignment?: {
    title: string
    description: string
  }
  student_name?: string
}

interface Assignment {
  id: string
  title: string
  description: string
}

export default function TeacherSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch all assignments created by this teacher
        const assignmentsData = await assignmentAPI.getAll()
        const teacherAssignments = assignmentsData.filter((assignment: any) => assignment.creator_id === user.uid)

        // Create a map of assignment IDs to assignment objects
        const assignmentMap: Record<string, Assignment> = {}
        teacherAssignments.forEach((assignment: Assignment) => {
          assignmentMap[assignment.id] = assignment
        })
        setAssignments(assignmentMap)

        // Fetch submissions for each assignment
        const allSubmissions: Submission[] = []
        for (const assignment of teacherAssignments) {
          const assignmentSubmissions = await assignmentAPI.getSubmissions(assignment.id)
          // Add assignment details to each submission
          const submissionsWithAssignment = assignmentSubmissions.map((submission: Submission) => ({
            ...submission,
            assignment: {
              title: assignment.title,
              description: assignment.description,
            },
          }))
          allSubmissions.push(...submissionsWithAssignment)
        }

        setSubmissions(allSubmissions)
        setFilteredSubmissions(allSubmissions)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch submissions",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubmissions(submissions)
    } else {
      const filtered = submissions.filter(
        (submission) =>
          submission.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (submission.assignment?.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredSubmissions(filtered)
    }
  }, [searchQuery, submissions])

  const handleEvaluate = async (assignmentId: string, submissionId: string) => {
    setIsEvaluating(true)

    try {
      await submissionAPI.requestEvaluation(assignmentId, submissionId)

      toast({
        title: "Success",
        description: "Evaluation request submitted successfully",
      })

      // Update the submission status in the local state
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => (sub.id === submissionId ? { ...sub, ai_processing_status: "processing" } : sub)),
      )

      setFilteredSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => (sub.id === submissionId ? { ...sub, ai_processing_status: "processing" } : sub)),
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request evaluation",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const getStatusBadge = (submission: Submission) => {
    if (submission.ai_processing_status === "completed") {
      if (submission.feedback_status === "approved") {
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      }
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      )
    } else if (submission.ai_processing_status === "processing") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Processing
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Pending Evaluation
        </Badge>
      )
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Student Submissions</h1>

          <div className="flex items-center space-x-2 bg-card p-3 rounded-lg shadow-sm">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by student ID or assignment title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-card p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                All Submissions
              </TabsTrigger>
              <TabsTrigger
                value="evaluated"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                Evaluated
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                Pending Evaluation
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                Needs Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No submissions match your search" : "No submissions found"}
                  </CardContent>
                </Card>
              ) : (
                <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
                  {filteredSubmissions.map((submission) => (
                    <motion.div key={submission.id} variants={item}>
                      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-3">
                              <h3 className="text-lg font-medium">{submission.assignment?.title || "Assignment"}</h3>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <User className="h-4 w-4 mr-1" />
                                <span>
                                  {submission.student_name || "Unknown Student"}{" "}
                                  <span className="text-xs opacity-75">ID: {submission.student_id}</span>
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(submission)}
                                {submission.overall_marks !== undefined && (
                                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                    Score: {submission.overall_marks} / {submission.max_possible_marks}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {submission.ai_processing_status !== "completed" &&
                                submission.ai_processing_status !== "processing" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEvaluate(submission.assignment_id, submission.id)}
                                    disabled={isEvaluating}
                                    className="transition-all hover:scale-105"
                                  >
                                    Evaluate
                                  </Button>
                                )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/teacher/submissions/${submission.id}`)}
                                className="transition-all hover:scale-105 hover:border-primary"
                              >
                                View Details
                                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="evaluated" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubmissions.filter(
                  (s) => s.ai_processing_status === "completed" && s.feedback_status === "approved",
                ).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No approved submissions found
                  </CardContent>
                </Card>
              ) : (
                <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
                  {filteredSubmissions
                    .filter((s) => s.ai_processing_status === "completed" && s.feedback_status === "approved")
                    .map((submission) => (
                      <motion.div key={submission.id} variants={item}>
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 border-green-200 dark:border-green-800">
                          <div className="h-1 bg-green-500" />
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3">
                                <h3 className="text-lg font-medium">{submission.assignment?.title || "Assignment"}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>
                                    {submission.student_name || "Unknown Student"}{" "}
                                    <span className="text-xs opacity-75">ID: {submission.student_id}</span>
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="success" className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Approved
                                  </Badge>
                                  {submission.overall_marks !== undefined && (
                                    <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                      Score: {submission.overall_marks} / {submission.max_possible_marks}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/teacher/submissions/${submission.id}`)}
                                className="transition-all hover:scale-105 hover:border-primary"
                              >
                                View Details
                                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubmissions.filter((s) => s.ai_processing_status !== "completed").length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No pending submissions found
                  </CardContent>
                </Card>
              ) : (
                <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
                  {filteredSubmissions
                    .filter((s) => s.ai_processing_status !== "completed")
                    .map((submission) => (
                      <motion.div key={submission.id} variants={item}>
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 border-amber-200 dark:border-amber-800">
                          {submission.ai_processing_status === "processing" && (
                            <div className="h-1 bg-blue-500 relative overflow-hidden">
                              <div className="absolute inset-0 bg-blue-300 animate-pulse"></div>
                            </div>
                          )}
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3">
                                <h3 className="text-lg font-medium">{submission.assignment?.title || "Assignment"}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>
                                    {submission.student_name || "Unknown Student"}{" "}
                                    <span className="text-xs opacity-75">ID: {submission.student_id}</span>
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                                </div>
                                {getStatusBadge(submission)}
                              </div>
                              <div className="flex gap-2">
                                {submission.ai_processing_status !== "processing" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEvaluate(submission.assignment_id, submission.id)}
                                    disabled={isEvaluating}
                                    className="transition-all hover:scale-105"
                                  >
                                    Evaluate
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/teacher/submissions/${submission.id}`)}
                                  className="transition-all hover:scale-105 hover:border-primary"
                                >
                                  View Details
                                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubmissions.filter(
                  (s) => s.ai_processing_status === "completed" && s.feedback_status !== "approved",
                ).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No submissions need review
                  </CardContent>
                </Card>
              ) : (
                <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
                  {filteredSubmissions
                    .filter((s) => s.ai_processing_status === "completed" && s.feedback_status !== "approved")
                    .map((submission) => (
                      <motion.div key={submission.id} variants={item}>
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 border-blue-200 dark:border-blue-800">
                          <div className="h-1 bg-blue-500" />
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3">
                                <h3 className="text-lg font-medium">{submission.assignment?.title || "Assignment"}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>
                                    {submission.student_name || "Unknown Student"}{" "}
                                    <span className="text-xs opacity-75">ID: {submission.student_id}</span>
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                                </div>
                                <Badge variant="warning" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Needs Review
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/teacher/submissions/${submission.id}`)}
                                className="transition-all hover:scale-105 hover:border-primary"
                              >
                                Review Now
                                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

