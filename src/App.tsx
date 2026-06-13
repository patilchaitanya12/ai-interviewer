import { useState } from 'react'
import { useInterview } from './hooks/useInterview'
import { ScreenCapture } from './components/ScreenCapture'
import { InterviewChat } from './components/InterviewChat'
import { FeedbackReport } from './components/FeedbackReport'
import { StatusIndicator } from './components/StatusIndicator'
import { ThemeToggle } from './components/ThemeToggle'

export default function App() {
  const [studentName, setStudentName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [started, setStarted] = useState(false)

  const { session, videoElement, startInterview, stopInterview } = useInterview()

  const handleStart = async () => {
    if (!studentName.trim() || !projectName.trim()) return
    setStarted(true)
    await startInterview(studentName, projectName)
  }

  const handleReset = () => {
    stopInterview()
    setStarted(false)
    setStudentName('')
    setProjectName('')
  }

  return (
    <div className="app">
      {!started && (
        <div className="setup-screen">
          <div style={{ position: 'absolute', top: 20, right: 20 }}>
            <ThemeToggle />
          </div>
          <div className="setup-card">
            <div className="logo">
              <span className="logo-icon">⬡</span>
              <h1>AI Interviewer</h1>
              <p>Adaptive technical interviews powered by local AI</p>
            </div>
            <div className="form">
              <div className="field">
                <label>Student Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Project Name</label>
                <input
                  type="text"
                  placeholder="What are you presenting?"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                />
              </div>
              <button
                className="start-btn"
                onClick={handleStart}
                disabled={!studentName.trim() || !projectName.trim()}
              >
                Begin Interview
              </button>
            </div>
            <div className="info-chips">
              <span className="chip">🎤 Voice Questions</span>
              <span className="chip">👁 Screen Analysis</span>
              <span className="chip">📊 Live Scoring</span>
              <span className="chip">🔒 Fully Local</span>
            </div>
          </div>
        </div>
      )}

      {started && session.status !== 'complete' && (
        <div className="interview-screen">
          <header className="interview-header">
            <div className="header-left">
              <span className="logo-icon small">⬡</span>
              <span className="header-title">AI Interviewer</span>
            </div>
            <StatusIndicator status={session.status} />
            <div className="header-right">
              <span className="progress">
                Question {Math.min(session.currentQuestionIndex + 1, 5)} / 5
              </span>
              <ThemeToggle />
              <button className="stop-btn" onClick={handleReset}>End</button>
            </div>
          </header>
          <div className="interview-body">
            <ScreenCapture videoElement={videoElement} />
            <InterviewChat session={session} />
          </div>
        </div>
      )}

      {session.status === 'complete' && session.report && (
        <FeedbackReport report={session.report} onReset={handleReset} />
      )}
    </div>
  )
}
