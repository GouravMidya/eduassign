"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI, submissionAPI } from "@/lib/api"
import { FileText, CheckCircle, AlertCircle } from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  created_at: string
}

interface Submission {
  id: string
  assignment_id: string
  submitted_at: string
  status: string
  ai_processing_status: string
  overall_marks?: number
  max_possible_marks?: number
  assignment?: {
    title: string
    description: string
  }
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch all assignments
        const assignmentsData = await assignmentAPI.getAll()
        setAssignments(assignmentsData)

        // Fetch student's submissions
        const submissionsData = await submissionAPI.getByStudent(user.uid)
        setSubmissions(submissionsData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  // Get assignments that haven't been submitted yet
  const pendingAssignments = assignments.filter(
    (assignment) => !submissions.some((submission) => submission.assignment_id === assignment.id),
  )

  return (
    <ProtectedRoute allowedUserTypes={["student"]}>
      <DashboardLayout userType="student">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">{assignments.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                  <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
              <CardDescription>Assignments that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading assignments...</div>
              ) : pendingAssignments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No pending assignments. Great job!</div>
              ) : (
                <div className="space-y-4">
                  {pendingAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {assignment.description.length > 100
                              ? `${assignment.description.substring(0, 100)}...`
                              : assignment.description}
                          </p>
                        </div>
                        <Button asChild>
                          <Link href={`/student/assignments/${assignment.id}`}>Submit</Link>
                        </Button>
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/assignments">View All Assignments</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Your recently submitted assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No submissions yet. Start by submitting an assignment!
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{submission.assignment?.title || "Assignment"}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          {submission.overall_marks !== undefined && (
                            <p className="text-sm font-medium mt-1">
                              Score: {submission.overall_marks} / {submission.max_possible_marks}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" asChild>
                          <Link href={`/student/feedback/${submission.id}`}>View Feedback</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/feedback">View All Feedback</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

