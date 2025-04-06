"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { submissionAPI } from "@/lib/api"
import { Search, Calendar, ArrowRight, AlertTriangle } from "lucide-react"

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

export default function StudentFeedback() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const data = await submissionAPI.getByStudent(user.uid)
        setSubmissions(data)
        setFilteredSubmissions(data)
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

    fetchSubmissions()
  }, [user, toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubmissions(submissions)
    } else {
      const filtered = submissions.filter((submission) =>
        (submission.assignment?.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredSubmissions(filtered)
    }
  }, [searchQuery, submissions])

  return (
    <ProtectedRoute allowedUserTypes={["student"]}>
      <DashboardLayout userType="student">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Assignment Feedback</h1>

          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by assignment title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading feedback...</div>
            ) : filteredSubmissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  {searchQuery ? "No submissions match your search" : "No submissions found"}
                </CardContent>
              </Card>
            ) : (
              filteredSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">{submission.assignment?.title || "Assignment"}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>

                        {submission.ai_processing_status === "completed" ? (
                          <div className="space-y-2">
                            <Badge>Feedback Available</Badge>
                            {submission.overall_marks !== undefined && (
                              <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                  <span>Score</span>
                                  <span>
                                    {submission.overall_marks} / {submission.max_possible_marks}
                                  </span>
                                </div>
                                <Progress
                                  value={(submission.overall_marks / (submission.max_possible_marks || 1)) * 100}
                                  className="h-2"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-amber-600">
                              {submission.ai_processing_status === "processing"
                                ? "Feedback processing..."
                                : "Feedback pending"}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student/feedback/${submission.id}`}>
                          View Feedback
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

