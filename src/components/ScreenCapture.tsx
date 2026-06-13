import { useEffect, useRef } from 'react'

interface Props {
  videoElement: HTMLVideoElement | null
}

export function ScreenCapture({ videoElement }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!videoElement || !containerRef.current) return
    containerRef.current.appendChild(videoElement)
    videoElement.style.width = '100%'
    videoElement.style.height = '100%'
    videoElement.style.objectFit = 'contain'
    return () => {
      if (containerRef.current?.contains(videoElement)) {
        containerRef.current.removeChild(videoElement)
      }
    }
  }, [videoElement])

  return (
    <div className="screen-capture-panel">
      <div className="panel-header">
        <span className="panel-title">
          <span className="dot accent" /> Screen Feed
        </span>
        <span className="panel-sub">OCR scanning every 5s</span>
      </div>
      <div className="video-container" ref={containerRef}>
        {!videoElement && (
          <div className="video-placeholder">
            <span className="placeholder-icon">🖥</span>
            <span>Waiting for screen share…</span>
          </div>
        )}
      </div>
    </div>
  )
}
