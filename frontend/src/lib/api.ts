const API_BASE_URL = "http://localhost:8000"  // Change to your actual API URL

// Helper function for making API requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API request failed with status ${response.status}`)
  }

  return response.json()
}

// File upload helper
async function uploadFile(endpoint: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `File upload failed with status ${response.status}`)
  }

  return response.json()
}

// Assignment APIs
export const assignmentAPI = {
  // Get all assignments
  getAll: () => fetchAPI("/assignments/"),

  // Get assignment details
  getById: (id: string, includeContent = false) => fetchAPI(`/assignments/${id}?include_content=${includeContent}`),

  // Create new assignment
  create: (data: { creator_id: string; title: string; description: string; file: File }) => {
    const formData = new FormData()
    formData.append("creator_id", data.creator_id)
    formData.append("title", data.title)
    formData.append("description", data.description)
    formData.append("file", data.file)

    return uploadFile("/assignments/", formData)
  },

  // Get submissions for an assignment
  getSubmissions: (assignmentId: string) => fetchAPI(`/assignments/${assignmentId}/submissions`),
}

// Submission APIs
export const submissionAPI = {
  // Get all submissions for a student
  getByStudent: (studentId: string) => fetchAPI(`/students/${studentId}/submissions`),

  // Get submission details
  getById: (id: string, includeContent = false) => fetchAPI(`/submissions/${id}?include_content=${includeContent}`),

  // Create new submission
  create: (data: { assignment_id: string; student_id: string; student_name: string; file: File }) => {
    const formData = new FormData()
    formData.append("assignment_id", data.assignment_id)
    formData.append("student_id", data.student_id)
    formData.append("student_name", data.student_name)
    formData.append("file", data.file)

    return uploadFile("/submissions/", formData)
  },

  // Get feedback for a submission
  getFeedback: (submissionId: string) => fetchAPI(`/submissions/${submissionId}/feedback`),

  // Request evaluation for a submission
  requestEvaluation: (assignmentId: string, submissionId: string) =>
    fetchAPI(`/evaluate/${assignmentId}/${submissionId}`, { method: "POST" }),

  // Update feedback for a submission
  updateFeedback: (submissionId: string, feedbackData: any) =>
    fetchAPI(`/submissions/${submissionId}/feedback`, {
      method: "PUT",
      body: JSON.stringify(feedbackData),
    }),

  // Approve feedback for a submission (make visible to student)
  approveFeedback: (submissionId: string) =>
    fetchAPI(`/submissions/${submissionId}/approve-feedback`, { method: "POST" }),
}

