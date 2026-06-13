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
  logs: [],
  report: null
}

export function useInterview() {
  const [session, setSession] = useState<InterviewSession>(initialSession)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const serviceRef = useRef<InterviewService | null>(null)

  const updateSession = useCallback((partial: Partial<InterviewSession>) => {
    setSession(prev => ({ ...prev, ...partial }))
  }, [])

  const startInterview = useCallback(async (
    studentName: string,
    projectName: string
  ) => {
    try {
      serviceRef.current = new InterviewService(updateSession)
      updateSession({ status: 'capturing' })
      const video = await serviceRef.current.startScreenCapture()
      setVideoElement(video)
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

  const stopListening = useCallback(() => {
    serviceRef.current?.sttService.stopAndResolve()
  }, [])

  const stopInterview = useCallback(() => {
    serviceRef.current?.cleanup()
    setSession(initialSession)
    setVideoElement(null)
  }, [])

  return { session, videoElement, startInterview, stopInterview, stopListening }
}
