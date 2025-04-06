"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI } from "@/lib/api"
import { Upload, FileText } from "lucide-react"

export default function CreateAssignment() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !title || !description || !file) {
      toast({
        title: "Error",
        description: "Please fill in all fields and upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await assignmentAPI.create({
        creator_id: user.uid,
        title,
        description,
        file,
      })

      toast({
        title: "Success",
        description: "Assignment created successfully",
      })

      router.push("/teacher/assignments")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Assignment</h1>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
                <CardDescription>
                  Create a new assignment for your students. Upload a PDF file with the assignment content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter assignment title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter assignment description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Assignment PDF</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Input id="file" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">{file ? file.name : "Click to upload PDF file"}</span>
                      <span className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</span>
                    </Label>
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-sm text-muted-foreground mb-2">- OR -</div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTitle("Unit Test-I: Database Management System (DBMS)")
                        setDescription(
                          "This test evaluates core DBMS concepts including data abstraction, ER/EER modeling, and relational algebra. Students must apply theoretical knowledge to practical scenarios using clear logic, justified assumptions, and neat diagrams.",
                        )

                        // Create a demo file
                        fetch("/demo-assignment.pdf")
                          .then((res) => res.blob())
                          .then((blob) => {
                            const demoFile = new File([blob], "demo-assignment.pdf", { type: "application/pdf" })
                            setFile(demoFile)
                          })
                          .catch((err) => {
                            console.error("Error loading demo file:", err)
                            toast({
                              title: "Error",
                              description: "Failed to load demo assignment",
                              variant: "destructive",
                            })
                          })
                      }}
                      className="btn-hover"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Use Demo Assignment
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Assignment"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

