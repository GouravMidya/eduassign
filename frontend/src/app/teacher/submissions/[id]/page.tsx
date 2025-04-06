"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { submissionAPI, assignmentAPI } from "@/lib/api"
import { ArrowLeft, FileText, AlertTriangle, User, Save, CheckCircle, Edit, X, Eye, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import DocumentViewer from "@/components/document-viewer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ResizablePanels } from "@/components/resizable-panels"

interface FeedbackItem {
  category_id: number
  text: string
}

interface QuestionEvaluation {
  question_reference: string
  marks_awarded: number
  max_marks: number
  feedback: FeedbackItem[]
}

interface Feedback {
  submission_id: string
  assignment_id: string
  student_id: string
  question_evaluations: QuestionEvaluation[]
  overall_feedback: string
  overall_marks: number
  max_possible_marks: number
  feedback_categories: Array<{
    id: number
    name: string
    description: string
  }>
}

export default function SubmissionDetails() {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [submission, setSubmission] = useState<any | null>(null)
  const [assignment, setAssignment] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedFeedback, setEditedFeedback] = useState<Feedback | null>(null)
  const [activeTab, setActiveTab] = useState("feedback")
  const [progressValue, setProgressValue] = useState(0)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return

      try {
        setIsLoading(true)

        // Fetch submission details
        const submissionData = await submissionAPI.getById(id as string)
        setSubmission(submissionData)

        // Fetch assignment details
        const assignmentData = await assignmentAPI.getById(submissionData.assignment_id)
        setAssignment(assignmentData)

        // Fetch feedback if available
        if (submissionData.ai_processing_status === "completed") {
          const feedbackData = await submissionAPI.getFeedback(id as string)
          setFeedback(feedbackData)
          setEditedFeedback(feedbackData)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch submission details",
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

  const handleEvaluate = async () => {
    if (!submission || !submission.assignment_id) return

    setIsEvaluating(true)
    setProgressValue(0)

    try {
      await submissionAPI.requestEvaluation(submission.assignment_id, id as string)

      toast({
        title: "Success",
        description: "Evaluation request submitted successfully",
      })

      // Refresh submission data
      const submissionData = await submissionAPI.getById(id as string)
      setSubmission(submissionData)
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

  const handleSaveEdits = async () => {
    if (!editedFeedback || !submission) return

    setIsSaving(true)

    try {
      await submissionAPI.updateFeedback(id as string, editedFeedback)

      toast({
        title: "Success",
        description: "Feedback updated successfully",
      })

      setFeedback(editedFeedback)
      setEditMode(false)

      // Refresh submission data
      const submissionData = await submissionAPI.getById(id as string)
      setSubmission(submissionData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update feedback",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveFeedback = async () => {
    if (!submission) return

    setIsApproving(true)

    try {
      await submissionAPI.approveFeedback(id as string)

      toast({
        title: "Success",
        description: "Feedback approved and now visible to student",
      })

      // Refresh submission data
      const submissionData = await submissionAPI.getById(id as string)
      setSubmission(submissionData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve feedback",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleOverallFeedbackChange = (value: string) => {
    if (editedFeedback) {
      setEditedFeedback({
        ...editedFeedback,
        overall_feedback: value,
      })
    }
  }

  const handleMarksChange = (value: string, questionIndex: number) => {
    if (!editedFeedback) return

    const newMarks = Number.parseInt(value)
    if (isNaN(newMarks)) return

    const updatedEvaluations = [...editedFeedback.question_evaluations]
    updatedEvaluations[questionIndex] = {
      ...updatedEvaluations[questionIndex],
      marks_awarded: newMarks,
    }

    // Recalculate overall marks
    const newOverallMarks = updatedEvaluations.reduce((sum, q) => sum + q.marks_awarded, 0)

    setEditedFeedback({
      ...editedFeedback,
      question_evaluations: updatedEvaluations,
      overall_marks: newOverallMarks,
    })
  }

  const handleFeedbackItemChange = (value: string, questionIndex: number, feedbackIndex: number) => {
    if (!editedFeedback) return

    const updatedEvaluations = [...editedFeedback.question_evaluations]
    const updatedFeedback = [...updatedEvaluations[questionIndex].feedback]
    updatedFeedback[feedbackIndex] = {
      ...updatedFeedback[feedbackIndex],
      text: value,
    }

    updatedEvaluations[questionIndex] = {
      ...updatedEvaluations[questionIndex],
      feedback: updatedFeedback,
    }

    setEditedFeedback({
      ...editedFeedback,
      question_evaluations: updatedEvaluations,
    })
  }

  const getFeedbackStatus = () => {
    if (!submission) return "Unknown"

    if (submission.ai_processing_status === "pending") return "Pending Evaluation"
    if (submission.ai_processing_status === "processing") return "Processing"
    if (submission.ai_processing_status === "completed") {
      if (submission.feedback_status === "approved") return "Approved"
      if (submission.feedback_status === "teacher_review_pending") return "Pending Review"
      return "Ready for Review"
    }
    return "Unknown"
  }

  const getStatusBadgeVariant = () => {
    if (!submission) return "secondary"

    if (submission.ai_processing_status === "pending") return "secondary"
    if (submission.ai_processing_status === "processing") return "info"
    if (submission.ai_processing_status === "completed") {
      if (submission.feedback_status === "approved") return "success"
      return "warning"
    }
    return "secondary"
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
    if (submission.ai_processing_status !== "completed") {
      return (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200 dark:border-amber-800 shadow-md overflow-hidden">
            <div className="relative">
              <Progress value={progressValue} className="h-1 rounded-none bg-amber-100 dark:bg-amber-950/30" />
              {submission.ai_processing_status === "processing" && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent animate-shimmer" />
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center">
                {submission.ai_processing_status === "processing" ? (
                  <>
                    <Loader2 className="h-5 w-5 text-info mr-2 animate-spin" />
                    Evaluation In Progress
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    Evaluation Not Available Yet
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {submission.ai_processing_status === "processing"
                  ? "The AI is currently evaluating this submission. This may take a few minutes."
                  : "This submission has not been evaluated yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Processing Status:</p>
                  <Badge
                    variant={submission.ai_processing_status === "processing" ? "info" : "warning"}
                    className="mt-1"
                  >
                    {submission.ai_processing_status === "processing" ? "Processing" : "Pending Evaluation"}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium">Submission Date:</p>
                  <p className="text-sm text-muted-foreground">{new Date(submission.submitted_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    if (!feedback) {
      return <div className="text-center py-8">Feedback data not available</div>
    }

    return (
      <>
        <motion.div variants={itemVariants}>
          <Card className="shadow-md overflow-hidden card-hover">
            <div className={`h-1 ${submission.feedback_status === "approved" ? "bg-success" : "bg-warning"}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Feedback Status</CardTitle>
              <Badge variant={getStatusBadgeVariant()}>{getFeedbackStatus()}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                {submission.feedback_status === "approved"
                  ? "This feedback has been approved and is visible to the student."
                  : "This feedback is not yet visible to the student. Review and approve to make it visible."}
              </p>
            </CardContent>
            {submission.feedback_status !== "approved" && (
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(!editMode)}
                  disabled={isApproving}
                  className="btn-hover"
                >
                  {editMode ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Editing
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Feedback
                    </>
                  )}
                </Button>
                {editMode ? (
                  <Button onClick={handleSaveEdits} disabled={isSaving} className="btn-hover">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleApproveFeedback}
                    disabled={isApproving}
                    className="bg-success hover:bg-success/90 btn-hover"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Feedback
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md card-hover">
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Score</span>
                    <span className="text-sm font-medium">
                      {editMode ? editedFeedback?.overall_marks : feedback.overall_marks} /{" "}
                      {feedback.max_possible_marks}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${((editMode ? editedFeedback?.overall_marks : feedback.overall_marks) / feedback.max_possible_marks) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Overall Feedback</h3>
                  {editMode ? (
                    <Textarea
                      value={editedFeedback?.overall_feedback || ""}
                      onChange={(e) => handleOverallFeedbackChange(e.target.value)}
                      className="min-h-[120px] transition-all focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm text-card-foreground whitespace-pre-line">{feedback.overall_feedback}</p>
                  )}
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
                {(editMode ? editedFeedback?.question_evaluations : feedback.question_evaluations)?.map(
                  (question, qIndex) => (
                    <motion.div
                      key={qIndex}
                      className="border-b pb-4 last:border-0 last:pb-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: qIndex * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{question.question_reference}</h3>
                        {editMode ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={question.marks_awarded}
                              onChange={(e) => handleMarksChange(e.target.value, qIndex)}
                              className="w-16 h-8 px-2 border rounded-md text-center mr-1 focus:border-primary focus:ring-primary"
                              min="0"
                              max={question.max_marks}
                            />
                            <span>/ {question.max_marks} points</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                            {question.marks_awarded} / {question.max_marks} points
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mt-3">
                        {question.feedback.map((item, fIndex) => {
                          const category = feedback.feedback_categories.find((c) => c.id === item.category_id)

                          return (
                            <div key={fIndex} className="text-sm">
                              <span className="font-medium text-card-foreground">{category?.name || "Feedback"}:</span>{" "}
                              {editMode ? (
                                <Textarea
                                  value={item.text}
                                  onChange={(e) => handleFeedbackItemChange(e.target.value, qIndex, fIndex)}
                                  className="mt-1 transition-all focus:border-primary"
                                />
                              ) : (
                                <span className="text-muted-foreground">{item.text}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </>
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
          title="Student Submission"
          className="h-full"
        />
      </ResizablePanels>
    )
  }

  const renderSubmissionTab = () => {
    return (
      <motion.div
        key="submission"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className="shadow-md card-hover">
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submission Date</h3>
                  <p className="font-medium">{new Date(submission.submitted_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Student</h3>
                  <p className="font-medium">{submission.student_name || "Unknown Student"}</p>
                  <p className="text-xs text-muted-foreground">ID: {submission.student_id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Assignment</h3>
                  <p className="font-medium">{assignment?.title || "Unknown Assignment"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={getStatusBadgeVariant()} className="mt-1">
                    {getFeedbackStatus()}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Assignment Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {assignment?.description || "No description available"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full btn-hover"
              onClick={() => {
                import("@/lib/firebase").then(({ openDocumentInViewer }) => {
                  openDocumentInViewer(submission.document_url, `submissions/${submission.id}.pdf`)
                })
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Submission Document
            </Button>
          </CardFooter>
        </Card>

        {submission.ai_processing_status === "completed" && feedback && (
          <Card className="shadow-md card-hover">
            <CardHeader>
              <CardTitle>Evaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      {feedback.overall_marks} / {feedback.max_possible_marks}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ({((feedback.overall_marks / feedback.max_possible_marks) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="relative pt-1 mt-2">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${(feedback.overall_marks / feedback.max_possible_marks) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Feedback Status</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={submission.feedback_status === "approved" ? "success" : "warning"}>
                      {submission.feedback_status === "approved" ? "Approved" : "Pending Approval"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {submission.feedback_status === "approved"
                        ? "Student can view this feedback"
                        : "Student cannot view this feedback yet"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("feedback")} className="btn-hover">
                View Full Feedback
              </Button>
              {submission.feedback_status !== "approved" && (
                <Button
                  onClick={handleApproveFeedback}
                  disabled={isApproving}
                  className="bg-success hover:bg-success/90 btn-hover"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Feedback
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </motion.div>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        <div className="max-w-[1600px] mx-auto">
          <Button variant="ghost" className="mb-6 group btn-hover" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading submission details...</p>
            </div>
          ) : !submission ? (
            <div className="text-center py-8">Submission not found</div>
          ) : (
            <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{assignment?.title || "Submission Details"}</h1>
                  <div className="flex items-center mt-2">
                    <User className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">
                      {submission.student_name || "Unknown Student"}
                      <span className="text-xs ml-2">ID: {submission.student_id}</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {submission.ai_processing_status !== "completed" && (
                    <Button
                      onClick={handleEvaluate}
                      disabled={isEvaluating || submission.ai_processing_status === "processing"}
                      className="btn-hover"
                    >
                      {submission.ai_processing_status === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Evaluate
                        </>
                      )}
                    </Button>
                  )}
                  {!isDesktop && (
                    <Button
                      variant="outline"
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
              </motion.div>

              {!isDesktop && (
                <motion.div variants={itemVariants} className="flex space-x-2 border-b">
                  <Button
                    variant="ghost"
                    className={`rounded-none border-b-2 ${activeTab === "feedback" ? "border-primary" : "border-transparent"}`}
                    onClick={() => setActiveTab("feedback")}
                  >
                    Feedback
                  </Button>
                  <Button
                    variant="ghost"
                    className={`rounded-none border-b-2 ${activeTab === "submission" ? "border-primary" : "border-transparent"}`}
                    onClick={() => setActiveTab("submission")}
                  >
                    Submission Details
                  </Button>
                </motion.div>
              )}

              {isDesktop ? (
                <div className="grid grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
                  <motion.div variants={itemVariants} className="h-full overflow-auto pr-2 space-y-6">
                    {renderFeedbackContent()}
                  </motion.div>
                  <motion.div variants={itemVariants} className="h-full">
                    {renderDocumentViewers()}
                  </motion.div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === "feedback" ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderFeedbackContent()}
                    </motion.div>
                  ) : (
                    renderSubmissionTab()
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

