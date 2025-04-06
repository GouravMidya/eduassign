"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI, submissionAPI } from "@/lib/api"
import { FileText, Calendar, User, ArrowRight } from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  created_at: string
  status: string
  document_url: string
  extracted_content?: string
}

interface Submission {
  id: string
  student_id: string
  submitted_at: string
  status: string
  ai_processing_status: string
  overall_marks?: number
  max_possible_marks?: number
  student_name?: string
}

export default function AssignmentDetails() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return

      try {
        setIsLoading(true)

        // Fetch assignment details
        const assignmentData = await assignmentAPI.getById(id as string, true)
        setAssignment(assignmentData)

        // Fetch submissions for this assignment
        const submissionsData = await assignmentAPI.getSubmissions(id as string)
        setSubmissions(submissionsData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch assignment details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, user, toast])

  const handleEvaluate = async (submissionId: string) => {
    if (!id) return

    setIsEvaluating(true)

    try {
      await submissionAPI.requestEvaluation(id as string, submissionId)

      toast({
        title: "Success",
        description: "Evaluation request submitted successfully",
      })

      // Refresh submissions to show updated status
      const submissionsData = await assignmentAPI.getSubmissions(id as string)
      setSubmissions(submissionsData)
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

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        {isLoading ? (
          <div className="text-center py-8">Loading assignment details...</div>
        ) : !assignment ? (
          <div className="text-center py-8">Assignment not found</div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
              <Badge variant={assignment.status === "active" ? "default" : "secondary"}>{assignment.status}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Created On</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <div className="font-medium">{new Date(assignment.created_at).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <div className="font-medium">{submissions.length}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      import("@/lib/firebase").then(({ openDocumentInViewer }) => {
                        openDocumentInViewer(assignment.document_url, `assignments/${assignment.id}.pdf`)
                      })
                    }}
                  >
                    View PDF
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{assignment.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>View and evaluate student submissions for this assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Submissions</TabsTrigger>
                    <TabsTrigger value="evaluated">Evaluated</TabsTrigger>
                    <TabsTrigger value="pending">Pending Evaluation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {submissions.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No submissions yet for this assignment</div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((submission) => (
                          <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-500 mr-2" />
                                  <h3 className="font-medium">
                                    {submission.student_name || "Unknown Student"}
                                    <span className="text-xs font-normal ml-2 text-gray-500">
                                      ID: {submission.student_id}
                                    </span>
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                </p>
                                {submission.overall_marks !== undefined && (
                                  <p className="text-sm font-medium mt-1">
                                    Score: {submission.overall_marks} / {submission.max_possible_marks}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {submission.ai_processing_status !== "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEvaluate(submission.id)}
                                    disabled={isEvaluating || submission.ai_processing_status === "processing"}
                                  >
                                    {submission.ai_processing_status === "processing" ? "Processing..." : "Evaluate"}
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={`/teacher/submissions/${submission.id}`}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      router.push(`/teacher/submissions/${submission.id}`)
                                    }}
                                  >
                                    View Details
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="evaluated">
                    {submissions.filter((s) => s.ai_processing_status === "completed").length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No evaluated submissions yet</div>
                    ) : (
                      <div className="space-y-4">
                        {submissions
                          .filter((s) => s.ai_processing_status === "completed")
                          .map((submission) => (
                            <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-500 mr-2" />
                                    <h3 className="font-medium">
                                      {submission.student_name || "Unknown Student"}
                                      <span className="text-xs font-normal ml-2 text-gray-500">
                                        ID: {submission.student_id}
                                      </span>
                                    </h3>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                  </p>
                                  {submission.overall_marks !== undefined && (
                                    <p className="text-sm font-medium mt-1">
                                      Score: {submission.overall_marks} / {submission.max_possible_marks}
                                    </p>
                                  )}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={`/teacher/submissions/${submission.id}`}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      router.push(`/teacher/submissions/${submission.id}`)
                                    }}
                                  >
                                    View Details
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pending">
                    {submissions.filter((s) => s.ai_processing_status !== "completed").length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No pending submissions</div>
                    ) : (
                      <div className="space-y-4">
                        {submissions
                          .filter((s) => s.ai_processing_status !== "completed")
                          .map((submission) => (
                            <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-500 mr-2" />
                                    <h3 className="font-medium">
                                      {submission.student_name || "Unknown Student"}
                                      <span className="text-xs font-normal ml-2 text-gray-500">
                                        ID: {submission.student_id}
                                      </span>
                                    </h3>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {submission.ai_processing_status === "processing"
                                      ? "Processing"
                                      : "Pending Evaluation"}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEvaluate(submission.id)}
                                    disabled={isEvaluating || submission.ai_processing_status === "processing"}
                                  >
                                    {submission.ai_processing_status === "processing" ? "Processing..." : "Evaluate"}
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <a
                                      href={`/teacher/submissions/${submission.id}`}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        router.push(`/teacher/submissions/${submission.id}`)
                                      }}
                                    >
                                      View Details
                                      <ArrowRight className="h-4 w-4 ml-1" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

