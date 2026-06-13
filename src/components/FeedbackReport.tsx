import { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { FeedbackReport as FeedbackReportType } from '../types/interview.types'

interface Props {
  report: FeedbackReportType
  onReset: () => void
}

const SCORE_LABELS: Record<string, string> = {
  technicalDepth:              'Technical Depth',
  clarityOfExplanation:        'Clarity of Explanation',
  originality:                 'Originality',
  implementationUnderstanding: 'Implementation Understanding',
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 25) * 100
  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">
        <span>{label}</span>
        <span style={{ color }}>{score}/25</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export function FeedbackReport({ report, onReset }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const grade =
    report.totalScore >= 80 ? 'Excellent' :
    report.totalScore >= 60 ? 'Good' :
    report.totalScore >= 40 ? 'Average' : 'Needs Work'

  const gradeColor =
    report.totalScore >= 80 ? 'var(--success)' :
    report.totalScore >= 60 ? 'var(--accent)' :
    report.totalScore >= 40 ? 'var(--warning)' : 'var(--danger)'

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return
    setDownloading(true)
    try {
      const node = reportRef.current
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#0a0a0f',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Interview_Report_${report.studentName.replace(/\s+/g, '_')}_${report.projectName.replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="report-screen">
      <div className="report-container" ref={reportRef}>

        {/* Header */}
        <div className="report-header">
          <div>
            <h2>Interview Report</h2>
            <p className="report-meta">
              {report.studentName} · {report.projectName} ·{' '}
              {new Date(report.generatedAt).toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="start-btn small"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? 'Generating…' : '⬇ Download PDF'}
            </button>
            <button className="start-btn small" onClick={onReset}>
              New Interview
            </button>
          </div>
        </div>

        {/* Total Score */}
        <div className="total-score-card">
          <div className="total-score-number" style={{ color: gradeColor }}>
            {report.totalScore}
          </div>
          <div className="total-score-label">out of 100</div>
          <div className="grade-badge" style={{ color: gradeColor, borderColor: gradeColor }}>
            {grade}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="report-card">
          <h3>Score Breakdown</h3>
          <div className="score-bars">
            {Object.entries(report.scores).map(([key, score]) => (
              <ScoreBar key={key} label={SCORE_LABELS[key]} score={score} />
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="report-grid">
          <div className="report-card">
            <h3>✓ Strengths</h3>
            <ul className="feedback-list">
              {report.strengths.map((s, i) => (
                <li key={i} className="feedback-item success">{s}</li>
              ))}
            </ul>
          </div>
          <div className="report-card">
            <h3>↑ Improvements</h3>
            <ul className="feedback-list">
              {report.improvements.map((s, i) => (
                <li key={i} className="feedback-item warning">{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary */}
        <div className="report-card">
          <h3>Summary</h3>
          <p className="summary-text">{report.summary}</p>
        </div>

        {/* Q&A Breakdown */}
        <div className="report-card">
          <h3>Question Breakdown</h3>
          <div className="qa-list">
            {report.questionAnswers.map((qa, i) => (
              <div key={i} className="qa-item">
                <div className="qa-header">
                  <span className="qa-num">Q{i + 1}</span>
                  <span className="qa-score" style={{
                    color: qa.score >= 18 ? 'var(--success)' :
                           qa.score >= 12 ? 'var(--warning)' : 'var(--danger)'
                  }}>
                    {qa.score}/25
                  </span>
                </div>
                <p className="qa-question">{qa.question.text}</p>
                <p className="qa-answer">{qa.answer.transcript}</p>
                <p className="qa-feedback">💬 {qa.feedback}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
