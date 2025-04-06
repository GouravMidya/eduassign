"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { assignmentAPI } from "@/lib/api"
import { FileText, Users, Clock } from "lucide-react"

interface Assignment {
  id: string
  creator_id: string
  title: string
  description: string
  created_at: string
  status: string
}

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        console.log("user not found")
        return
      }

      try {
        setIsLoading(true)
        const data = await assignmentAPI.getAll()
        // Filter assignments created by this teacher
        const teacherAssignments = data.filter((assignment: Assignment) => assignment.creator_id === user.uid)
        console.log("teacherAssignments", teacherAssignments)
        setAssignments(teacherAssignments)
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

    fetchAssignments()
  }, [user, toast])

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <Button asChild>
              <Link href="/teacher/assignments/create">Create Assignment</Link>
            </Button>
          </div>

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
                <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">24</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">7</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>View and manage your recently created assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active">
                <TabsList className="mb-4">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="all">All Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {isLoading ? (
                    <div className="text-center py-4">Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No active assignments found. Create your first assignment!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments
                        .filter((assignment) => assignment.status === "active")
                        .slice(0, 5)
                        .map((assignment) => (
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/teacher/assignments/${assignment.id}`}>View Details</Link>
                              </Button>
                            </div>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all">
                  {isLoading ? (
                    <div className="text-center py-4">Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No assignments found. Create your first assignment!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.slice(0, 5).map((assignment) => (
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/teacher/assignments/${assignment.id}`}>View Details</Link>
                            </Button>
                          </div>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                            <span className="ml-4">Status: {assignment.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/teacher/assignments">View All Assignments</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

