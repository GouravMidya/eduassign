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
import { assignmentAPI } from "@/lib/api"
import { Search, Plus, ArrowRight } from "lucide-react"

interface Assignment {
  id: string
  creator_id: string
  title: string
  description: string
  created_at: string
  status: string
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const data = await assignmentAPI.getAll()
        // Filter assignments created by this teacher
        const teacherAssignments = data.filter((assignment: Assignment) => assignment.creator_id === user.uid)
        setAssignments(teacherAssignments)
        setFilteredAssignments(teacherAssignments)
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

  return (
    <ProtectedRoute allowedUserTypes={["teacher"]}>
      <DashboardLayout userType="teacher">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <Button asChild>
              <Link href="/teacher/assignments/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Link>
            </Button>
          </div>

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
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    {searchQuery ? "No assignments match your search" : "No assignments found. Create your first one!"}
                  </CardContent>
                </Card>
              ) : (
                filteredAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">{assignment.title}</h3>
                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(assignment.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
                            {assignment.description.length > 150
                              ? `${assignment.description.substring(0, 150)}...`
                              : assignment.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/assignments/${assignment.id}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.filter((a) => a.status === "active").length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">No active assignments found</CardContent>
                </Card>
              ) : (
                filteredAssignments
                  .filter((a) => a.status === "active")
                  .map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{assignment.title}</h3>
                              <Badge>Active</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(assignment.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              {assignment.description.length > 150
                                ? `${assignment.description.substring(0, 150)}...`
                                : assignment.description}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/assignments/${assignment.id}`}>
                              View Details
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="archived" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : filteredAssignments.filter((a) => a.status === "archived").length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">No archived assignments found</CardContent>
                </Card>
              ) : (
                filteredAssignments
                  .filter((a) => a.status === "archived")
                  .map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{assignment.title}</h3>
                              <Badge variant="secondary">Archived</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(assignment.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              {assignment.description.length > 150
                                ? `${assignment.description.substring(0, 150)}...`
                                : assignment.description}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/assignments/${assignment.id}`}>
                              View Details
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

