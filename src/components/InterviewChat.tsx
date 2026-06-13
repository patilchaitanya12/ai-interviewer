import { useEffect, useRef, useState } from 'react'
import type { InterviewSession } from '../types/interview.types'

interface Props {
  session: InterviewSession
  onStopListening?: () => void
}

const STATUS_MESSAGE: Record<string, string> = {
  idle:        'Starting up…',
  loading:     'Analyzing screen and generating question…',
  capturing:   'Setting up screen capture…',
  questioning: 'Listen to the question being asked…',
  listening:   'Your turn — answer out loud',
  evaluating:  'Evaluating your answer…',
  complete:    'Interview complete!',
}

export function InterviewChat({ session, onStopListening }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const logBottomRef = useRef<HTMLDivElement>(null)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.questions.length, session.answers.length])

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.logs.length])

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <span className="panel-title">
          <span className="dot primary" /> Interview
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="log-toggle"
            onClick={() => setShowLogs(p => !p)}
          >
            {showLogs ? '💬 Chat' : '🔍 Logs'}
          </button>
          <span className="panel-sub">
            {session.currentQuestionIndex + 1} / {session.totalQuestions}
          </span>
        </div>
      </div>

      {/* Chat View */}
      {!showLogs && (
        <div className="chat-messages">
          {session.questions.map((q, i) => (
            <div key={q.id}>
              <div className="message interviewer">
                <div className="message-label">AI Interviewer</div>
                <div className="message-bubble interviewer-bubble">{q.text}</div>
              </div>
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
          <div className="status-message">
            <span className="status-blink">▋</span>
            {STATUS_MESSAGE[session.status]}
          </div>
          {session.status === 'listening' && onStopListening && (
            <button className="done-answering-btn" onClick={onStopListening}>
              ✓ Done Answering
            </button>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Logs View */}
      {showLogs && (
        <div className="log-panel">
          {session.logs.length === 0 && (
            <span className="log-empty">No logs yet…</span>
          )}
          {session.logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
          <div ref={logBottomRef} />
        </div>
      )}
    </div>
  )
}
