"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Search, Calendar, ArrowRight, CheckCircle } from "lucide-react"

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
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
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
        setFilteredAssignments(assignmentsData)

        // Fetch student's submissions
        const submissionsData = await submissionAPI.getByStudent(user.uid)
        setSubmissions(submissionsData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch assignments",
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
      setFilteredAssignments(assignments)
    } else {
      const filtered = assignments.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredAssignments(filtered)
    }
  }, [searchQuery, assignments])

  // Check if an assignment has been submitted
  const isSubmitted = (assignmentId: string) => {
    return submissions.some((submission) => submission.assignment_id === assignmentId)
  }

  // Get submission for an assignment
  const getSubmission = (assignmentId: string) => {
    return submissions.find((submission) => submission.assignment_id === assignmentId)
  }

  return (
    <ProtectedRoute allowedUserTypes={["student"]}>
      <DashboardLayout userType="student">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>

          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Assignments</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    {searchQuery ? "No assignments match your search" : "No assignments found"}
                  </CardContent>
                </Card>
              ) : (
                filteredAssignments.map((assignment) => {
                  const submitted = isSubmitted(assignment.id)
                  const submission = getSubmission(assignment.id)

                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{assignment.title}</h3>
                              {submitted && <Badge className="bg-green-500">Submitted</Badge>}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                            </div>
                            {submitted && submission && (
                              <div className="flex items-center text-sm text-gray-500">
                                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            <p className="text-sm text-gray-700 mt-1">
                              {assignment.description.length > 150
                                ? `${assignment.description.substring(0, 150)}...`
                                : assignment.description}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/student/assignments/${assignment.id}`}>
                              {submitted ? "View Submission" : "Submit Assignment"}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.filter((a) => !isSubmitted(a.id)).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    No pending assignments found. Great job!
                  </CardContent>
                </Card>
              ) : (
                filteredAssignments
                  .filter((a) => !isSubmitted(a.id))
                  .map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <h3 className="text-lg font-medium">{assignment.title}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {assignment.description.length > 150
                                ? `${assignment.description.substring(0, 150)}...`
                                : assignment.description}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/student/assignments/${assignment.id}`}>
                              Submit Assignment
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="submitted" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.filter((a) => isSubmitted(a.id)).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">No submitted assignments found</CardContent>
                </Card>
              ) : (
                filteredAssignments
                  .filter((a) => isSubmitted(a.id))
                  .map((assignment) => {
                    const submission = getSubmission(assignment.id)

                    return (
                      <Card key={assignment.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium">{assignment.title}</h3>
                                <Badge className="bg-green-500">Submitted</Badge>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                              </div>
                              {submission && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                                </div>
                              )}
                              <p className="text-sm text-gray-700 mt-1">
                                {assignment.description.length > 150
                                  ? `${assignment.description.substring(0, 150)}...`
                                  : assignment.description}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/student/assignments/${assignment.id}`}>
                                View Submission
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

