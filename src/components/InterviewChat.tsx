import { useEffect, useRef } from 'react'
import type { InterviewSession } from '../types/interview.types'

interface Props {
  session: InterviewSession
}

const STATUS_MESSAGE: Record<string, string> = {
  idle:        'Starting up…',
  loading:     'Analyzing your screen and generating a question…',
  capturing:   'Setting up screen capture…',
  questioning: 'Listen to the question being asked…',
  listening:   'Your turn — answer the question out loud',
  evaluating:  'Evaluating your answer…',
  complete:    'Interview complete!',
}

export function InterviewChat({ session }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.questions.length, session.answers.length])

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <span className="panel-title">
          <span className="dot primary" /> Interview
        </span>
        <span className="panel-sub">
          {session.currentQuestionIndex + 1} / {session.totalQuestions} questions
        </span>
      </div>

      <div className="chat-messages">
        {/* Render all Q&A pairs so far */}
        {session.questions.map((q, i) => (
          <div key={q.id}>
            {/* Question bubble */}
            <div className="message interviewer">
              <div className="message-label">AI Interviewer</div>
              <div className="message-bubble interviewer-bubble">{q.text}</div>
            </div>

            {/* Answer bubble if exists */}
            {session.answers[i] && (
              <div className="message student">
                <div className="message-label">You</div>
                <div className="message-bubble student-bubble">
                  {session.answers[i].transcript}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current status message */}
        <div className="status-message">
          <span className="status-blink">▋</span>
          {STATUS_MESSAGE[session.status]}
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
