"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { submissionAPI, assignmentAPI } from "@/lib/api"
import { ArrowLeft, FileText, AlertTriangle, Clock, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import DocumentViewer from "@/components/document-viewer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ResizablePanels } from "@/components/resizable-panels"

interface Feedback {
  submission_id: string
  assignment_id: string
  student_id: string
  question_evaluations: Array<{
    question_reference: string
    marks_awarded: number
    max_marks: number
    feedback: Array<{
      category_id: number
      text: string
    }>
  }>
  overall_feedback: string
  overall_marks: number
  max_possible_marks: number
  feedback_categories: Array<{
    id: number
    name: string
    description: string
  }>
}

export default function FeedbackDetails() {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [submission, setSubmission] = useState<any | null>(null)
  const [assignment, setAssignment] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progressValue, setProgressValue] = useState(0)
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return

      try {
        setIsLoading(true)

        // Fetch submission details
        const submissionData = await submissionAPI.getById(id as string)
        setSubmission(submissionData)

        // Fetch assignment details
        if (submissionData.assignment_id) {
          const assignmentData = await assignmentAPI.getById(submissionData.assignment_id)
          setAssignment(assignmentData)
        }

        // Fetch feedback if available and approved
        if (submissionData.ai_processing_status === "completed" && submissionData.feedback_status === "approved") {
          const feedbackData = await submissionAPI.getFeedback(id as string)
          setFeedback(feedbackData)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch feedback",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, user, toast])

  useEffect(() => {
    if (submission?.ai_processing_status === "processing") {
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 1000)

      return () => clearInterval(interval)
    } else if (submission?.ai_processing_status === "completed") {
      setProgressValue(100)
    }
  }, [submission?.ai_processing_status])

  // Group feedback by category
  const getFeedbackByCategory = (questionEvaluations: Feedback["question_evaluations"]) => {
    const categories: Record<number, string[]> = {}

    questionEvaluations.forEach((question) => {
      question.feedback.forEach((item) => {
        if (!categories[item.category_id]) {
          categories[item.category_id] = []
        }
        categories[item.category_id].push(`${question.question_reference}: ${item.text}`)
      })
    })

    return categories
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const renderFeedbackContent = () => {
    if (!feedback) return null

    return (
      <div className="space-y-6 pb-6">
        <motion.div variants={itemVariants}>
          <Card className="shadow-md overflow-hidden card-hover">
            <motion.div
              className="bg-success h-1"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8 }}
            />
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Score</span>
                    <span className="text-sm font-medium">
                      {feedback.overall_marks} / {feedback.max_possible_marks}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(feedback.overall_marks / feedback.max_possible_marks) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Overall Feedback</h3>
                  <p className="text-sm text-card-foreground whitespace-pre-line">{feedback.overall_feedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md card-hover">
            <CardHeader>
              <CardTitle>Question-by-Question Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {feedback.question_evaluations.map((question, index) => (
                  <motion.div
                    key={index}
                    className="border-b pb-4 last:border-0 last:pb-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{question.question_reference}</h3>
                      <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                        {question.marks_awarded} / {question.max_marks} points
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-3">
                      {question.feedback.map((item, fIndex) => {
                        const category = feedback.feedback_categories.find((c) => c.id === item.category_id)

                        return (
                          <div key={fIndex} className="text-sm">
                            <span className="font-medium text-card-foreground">{category?.name || "Feedback"}:</span>{" "}
                            <span className="text-muted-foreground">{item.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md card-hover">
            <CardHeader>
              <CardTitle>Feedback by Category</CardTitle>
              <CardDescription>Consolidated feedback organized by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {feedback.feedback_categories.map((category) => {
                  const categoryFeedback = getFeedbackByCategory(feedback.question_evaluations)[category.id]

                  if (!categoryFeedback || categoryFeedback.length === 0) {
                    return null
                  }

                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: category.id * 0.05 }}
                    >
                      <h3 className="font-medium mb-2">{category.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{category.description}</p>

                      <ul className="space-y-2 text-sm text-card-foreground">
                        {categoryFeedback.map((item, index) => (
                          <li
                            key={index}
                            className="pl-4 border-l-2 border-primary/20 hover:border-primary transition-colors"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const renderDocumentViewers = () => {
    if (!submission || !assignment) return null

    return (
      <ResizablePanels direction="vertical" className="h-full" defaultSizes={[50, 50]} minSizes={[30, 30]}>
        <DocumentViewer
          documentUrl={assignment.document_url}
          documentPath={`assignments/${assignment.id}.pdf`}
          title="Assignment Document"
          className="h-full"
        />
        <DocumentViewer
          documentUrl={submission.document_url}
          documentPath={`submissions/${submission.id}.pdf`}
          title="Your Submission"
          className="h-full"
        />
      </ResizablePanels>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["student"]}>
      <DashboardLayout userType="student">
        <div className="max-w-[1600px] mx-auto">
          <Button variant="ghost" className="mb-6 group btn-hover" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading feedback...</p>
            </div>
          ) : !submission ? (
            <div className="text-center py-8">Submission not found</div>
          ) : submission.ai_processing_status !== "completed" || submission.feedback_status !== "approved" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="border-amber-200 dark:border-amber-800 shadow-md overflow-hidden card-hover">
                <div className="relative">
                  <Progress value={progressValue} className="h-1 rounded-none bg-amber-100 dark:bg-amber-950/30" />
                  {submission.ai_processing_status === "processing" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent animate-shimmer" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {submission.ai_processing_status === "completed" ? (
                      <>
                        <Clock className="h-5 w-5 text-amber-500 mr-2" />
                        Feedback Under Review
                      </>
                    ) : submission.ai_processing_status === "processing" ? (
                      <>
                        <Loader2 className="h-5 w-5 text-info mr-2 animate-spin" />
                        Processing Your Submission
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                        Feedback Not Available Yet
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {submission.ai_processing_status === "completed"
                      ? "Your submission has been evaluated and is currently being reviewed by your teacher. Feedback will be available once approved."
                      : submission.ai_processing_status === "processing"
                        ? "Your submission is currently being processed by our AI system. This may take a few minutes."
                        : "Your submission is waiting to be evaluated. Please check back later."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Processing Status:</p>
                      <Badge
                        variant={
                          submission.ai_processing_status === "completed"
                            ? "warning"
                            : submission.ai_processing_status === "processing"
                              ? "info"
                              : "secondary"
                        }
                        className="mt-1"
                      >
                        {submission.ai_processing_status === "processing"
                          ? "Processing"
                          : submission.ai_processing_status === "completed"
                            ? "Awaiting Teacher Review"
                            : "Pending Evaluation"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Submission Date:</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 btn-hover"
                      onClick={() => {
                        import("@/lib/firebase").then(({ openDocumentInViewer }) => {
                          openDocumentInViewer(submission.document_url, `submissions/${submission.id}.pdf`)
                        })
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Your Submission
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !feedback ? (
            <div className="text-center py-8">Feedback data not available</div>
          ) : (
            <motion.div
              className={`${isDesktop ? "grid grid-cols-2 gap-6 h-[calc(100vh-10rem)]" : "space-y-6"}`}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="h-full overflow-auto pr-2">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-3xl font-bold tracking-tight">Assignment Feedback</h1>
                  {!isDesktop && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-hover"
                      onClick={() => {
                        import("@/lib/firebase").then(({ openDocumentInViewer }) => {
                          openDocumentInViewer(submission.document_url, `submissions/${submission.id}.pdf`)
                        })
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Submission
                    </Button>
                  )}
                </div>
                {renderFeedbackContent()}
              </motion.div>

              {isDesktop && (
                <motion.div variants={itemVariants} className="h-full">
                  {renderDocumentViewers()}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

