import { useState, useRef, useCallback } from 'react'
import { InterviewService } from '../services/interview.service'
import type { InterviewSession, FeedbackReport } from '../types/interview.types'

const initialSession: InterviewSession = {
  status: 'idle',
  currentQuestionIndex: 0,
  totalQuestions: 5,
  ocrContext: '',
  questions: [],
  answers: [],
  report: null
}

export function useInterview() {
  const [session, setSession] = useState<InterviewSession>(initialSession)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const serviceRef = useRef<InterviewService | null>(null)

  // Partial state update which merges changes into existing session
  const updateSession = useCallback((partial: Partial<InterviewSession>) => {
    setSession(prev => ({ ...prev, ...partial }))
  }, [])

  const startInterview = useCallback(async (
    studentName: string,
    projectName: string
  ) => {
    try {
      // Create service instance with state change callback
      serviceRef.current = new InterviewService(updateSession)

      // Start screen capture
      updateSession({ status: 'capturing' })
      const video = await serviceRef.current.startScreenCapture()
      setVideoElement(video)

      // Run full interview, get report back
      const report: FeedbackReport = await serviceRef.current.runInterview(
        studentName,
        projectName,
        video
      )

      updateSession({ status: 'complete', report })
    } catch (err) {
      console.error('Interview error:', err)
      updateSession({ status: 'idle' })
    }
  }, [updateSession])

  const stopInterview = useCallback(() => {
    serviceRef.current?.cleanup()
    setSession(initialSession)
    setVideoElement(null)
  }, [])

  return {
    session,
    videoElement,
    startInterview,
    stopInterview
  }
}
