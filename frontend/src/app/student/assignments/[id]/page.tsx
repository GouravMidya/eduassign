"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI, submissionAPI } from "@/lib/api"
import { Upload, FileText, Calendar } from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  created_at: string
  document_url: string
}

export default function SubmitAssignment() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { id } = useParams()
  const { user, userName } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!user || !id) return

      try {
        setIsLoading(true)
        const data = await assignmentAPI.getById(id as string)
        setAssignment(data)
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

    fetchAssignment()
  }, [id, user, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !id || !file) {
      toast({
        title: "Error",
        description: "Please select a PDF file to submit",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await submissionAPI.create({
        assignment_id: id as string,
        student_id: user.uid,
        student_name: userName,
        file,
      })

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      })

      router.push("/student/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit assignment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={["student"]}>
      <DashboardLayout userType="student">
        {isLoading ? (
          <div className="text-center py-8">Loading assignment details...</div>
        ) : !assignment ? (
          <div className="text-center py-8">Assignment not found</div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>

            <div className="grid gap-6 md:grid-cols-2">
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
                  <CardTitle className="text-sm font-medium text-gray-500">Assignment Document</CardTitle>
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
                    <FileText className="h-4 w-4 mr-2" />
                    View Assignment PDF
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
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Submit Your Solution</CardTitle>
                  <CardDescription>Upload your completed assignment as a PDF file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input id="file" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                      <Label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium">{file ? file.name : "Click to upload PDF file"}</span>
                        <span className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</span>
                      </Label>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-2">- OR -</div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Create a demo file
                          fetch("/demo-submission.pdf")
                            .then((res) => res.blob())
                            .then((blob) => {
                              const demoFile = new File([blob], "demo-submission.pdf", { type: "application/pdf" })
                              setFile(demoFile)
                            })
                            .catch((err) => {
                              console.error("Error loading demo file:", err)
                              toast({
                                title: "Error",
                                description: "Failed to load demo submission",
                                variant: "destructive",
                              })
                            })
                        }}
                        className="btn-hover"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Use Demo Submission
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !file}>
                    {isSubmitting ? "Submitting..." : "Submit Assignment"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

