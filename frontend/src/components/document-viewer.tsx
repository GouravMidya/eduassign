"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Maximize2, FileText, ExternalLink } from "lucide-react"
import { getFirebaseStorageUrl } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface DocumentViewerProps {
  documentUrl: string
  documentPath: string
  title: string
  className?: string
  contentClassName?: string
}

export default function DocumentViewer({
  documentUrl,
  documentPath,
  title,
  className = "",
  contentClassName = "",
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true)
        setError(null)

        // If it's already a full URL, use it directly
        if (documentUrl.startsWith("http")) {
          setUrl(documentUrl)
        } else {
          // If it's a storage path, get the download URL
          const downloadUrl = await getFirebaseStorageUrl(documentUrl)
          setUrl(downloadUrl)
        }
      } catch (err) {
        console.error("Error loading document:", err)
        setError("Failed to load document. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [documentUrl])

  const openInNewTab = () => {
    if (!url) return

    // For PDFs, use Google's PDF viewer
    if (documentPath.toLowerCase().endsWith(".pdf")) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`, "_blank")
    } else {
      // For other file types, just open the URL
      window.open(url, "_blank")
    }
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden flex flex-col h-full",
        className,
        fullscreen ? "fixed inset-0 z-50 rounded-none" : "",
      )}
    >
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0 bg-muted/50 shrink-0">
        <CardTitle className="text-sm font-medium flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          {title}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn("p-0 flex-1 flex items-center justify-center bg-muted/20 overflow-auto", contentClassName)}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={openInNewTab}>
              Try opening externally
            </Button>
          </div>
        ) : url ? (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            className="w-full h-full"
            frameBorder="0"
            title={title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">Document not available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

