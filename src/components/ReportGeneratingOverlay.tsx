import { useEffect, useState } from 'react'

const STEPS = [
  'Analyzing your responses…',
  'Scoring technical depth…',
  'Evaluating clarity & originality…',
  'Compiling strengths & improvements…',
  'Finalizing your report…',
]

export function ReportGeneratingOverlay() {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev
        const remaining = 92 - prev
        return prev + Math.max(0.3, remaining * 0.04)
      })
    }, 120)

    const stepInterval = setInterval(() => {
      setStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 1800)

    return () => {
      clearInterval(interval)
      clearInterval(stepInterval)
    }
  }, [])

  return (
    <div className="report-gen-overlay">
      <div className="report-gen-card">
        <div className="report-gen-spinner" />
        <h3>Generating Your Report</h3>
        <p className="report-gen-step">{STEPS[stepIndex]}</p>
        <div className="report-gen-track">
          <div className="report-gen-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="report-gen-pct">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
