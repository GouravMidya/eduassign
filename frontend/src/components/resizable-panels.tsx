"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode]
  direction?: "vertical" | "horizontal"
  className?: string
  defaultSizes?: [number, number]
  minSizes?: [number, number]
}

export function ResizablePanels({
  children,
  direction = "vertical",
  className,
  defaultSizes = [50, 50],
  minSizes = [20, 20],
}: ResizablePanelsProps) {
  const [sizes, setSizes] = useState(defaultSizes)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startPos = useRef(0)
  const startSizes = useRef(sizes)

  const isVertical = direction === "vertical"

  useEffect(() => {
    const container = containerRef.current
    const resizeHandle = resizeHandleRef.current
    if (!container || !resizeHandle) return

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true
      startPos.current = isVertical ? e.clientY : e.clientX
      startSizes.current = [...sizes]
      document.body.style.cursor = isVertical ? "ns-resize" : "ew-resize"
      document.body.style.userSelect = "none"
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const containerRect = container.getBoundingClientRect()
      const containerSize = isVertical ? containerRect.height : containerRect.width
      const delta = (isVertical ? e.clientY : e.clientX) - startPos.current
      const deltaPercent = (delta / containerSize) * 100

      const newSizes = [
        Math.max(minSizes[0], Math.min(100 - minSizes[1], startSizes.current[0] + deltaPercent)),
        Math.max(minSizes[1], Math.min(100 - minSizes[0], startSizes.current[1] - deltaPercent)),
      ]

      setSizes(newSizes)
    }

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.removeProperty("cursor")
        document.body.style.removeProperty("user-select")
      }
    }

    resizeHandle.addEventListener("mousedown", onMouseDown)
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)

    return () => {
      resizeHandle.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [isVertical, sizes, minSizes])

  return (
    <div ref={containerRef} className={cn("flex relative", isVertical ? "flex-col" : "flex-row", className)}>
      <div
        className={cn("overflow-auto", isVertical ? "h-[var(--first-panel-size)]" : "w-[var(--first-panel-size)]")}
        style={
          {
            [isVertical ? "--first-panel-size" : "--first-panel-size"]: `${sizes[0]}%`,
          } as React.CSSProperties
        }
      >
        {children[0]}
      </div>
      <div
        ref={resizeHandleRef}
        className={cn(
          "absolute z-10 flex items-center justify-center bg-border hover:bg-primary/20 transition-colors",
          isVertical
            ? "h-1 w-full cursor-ns-resize left-0 -translate-y-1/2"
            : "w-1 h-full cursor-ew-resize top-0 -translate-x-1/2",
          isVertical ? "top-[var(--first-panel-size)]" : "left-[var(--first-panel-size)]",
        )}
        style={
          {
            [isVertical ? "--first-panel-size" : "--first-panel-size"]: `${sizes[0]}%`,
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            "bg-primary/60 rounded-full transition-transform",
            isVertical ? "h-1 w-6" : "w-1 h-6",
            "scale-0 group-hover:scale-100",
          )}
        />
      </div>
      <div
        className={cn("overflow-auto", isVertical ? "h-[var(--second-panel-size)]" : "w-[var(--second-panel-size)]")}
        style={
          {
            [isVertical ? "--second-panel-size" : "--second-panel-size"]: `${sizes[1]}%`,
          } as React.CSSProperties
        }
      >
        {children[1]}
      </div>
    </div>
  )
}

