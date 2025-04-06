"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, BookOpen, Award } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const features = [
    {
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      title: "Smart Assignment Management",
      description:
        "Create, distribute, and track assignments with ease. Organize your educational workflow efficiently.",
    },
    {
      icon: <Award className="h-10 w-10 text-primary" />,
      title: "AI-Powered Feedback",
      description: "Receive detailed, personalized feedback on your work powered by advanced AI technology.",
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      title: "Teacher Review System",
      description:
        "Teachers can review AI-generated feedback before it reaches students, ensuring quality and accuracy.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b shadow-sm bg-white dark:bg-gray-900">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">EduAssign</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/login?tab=register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="space-y-6" variants={fadeIn}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                Assignment Management with <span className="text-primary">AI-Powered</span> Feedback
              </h2>
              <p className="text-lg text-gray-600">
                Streamline your educational workflow with our intelligent assignment management system. Create, submit,
                and receive personalized feedback with teacher oversight for quality assurance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="font-medium btn-hover">
                  <Link href="/login">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-medium btn-hover">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div className="rounded-lg overflow-hidden shadow-xl relative" variants={fadeIn}>
              <div className="absolute inset-0 bg-primary/10 rounded-lg transform -rotate-3 scale-105"></div>
              <img
                src="/hero_image.png"
                alt="Assignment Management Platform"
                className="w-full h-auto relative rounded-lg shadow-md"
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-12">Key Features</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md card-hover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.2, duration: 0.5 }}
                >
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t py-6 bg-white">
        <div className="container mx-auto px-6 text-center text-gray-600">
          &copy; {new Date().getFullYear()} EduAssign. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

