import { OCRService } from './ocr.service'
import { LLMService } from './llm.service'
import { TTSService } from './tts.service'
import { STTService } from './stt.service'
import type {
  InterviewSession,
  Question,
  Answer,
  QuestionAnswer,
  FeedbackReport,
  EvaluationScores
} from '../types/interview.types'

const TOTAL_QUESTIONS = 5
const OCR_INTERVAL_MS = 5000

export class InterviewService {
  private tts: TTSService
  private stt: STTService
  private ocrInterval: ReturnType<typeof setInterval> | null = null
  private videoRef: HTMLVideoElement | null = null
  private onStateChange: (session: Partial<InterviewSession>) => void
  get sttService() { return this.stt }
  private logs: string[] = []

  constructor(onStateChange: (session: Partial<InterviewSession>) => void) {
    this.tts = new TTSService()
    this.stt = new STTService()
    this.onStateChange = onStateChange
  }

  private log(msg: string) {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`
    this.logs = [...this.logs, entry]
    this.onStateChange({ logs: this.logs })
  }

  async startScreenCapture(): Promise<HTMLVideoElement> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 5,
        // @ts-ignore — non-standard but supported in Chrome
        displaySurface: 'window',
      },
      audio: false,
      // @ts-ignore — Chrome-specific hint to prefer window picker
      preferCurrentTab: false,
    })

    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    await new Promise(resolve => video.onloadedmetadata = resolve)
    this.videoRef = video
    return video
  }

  startOCRLoop(onContext: (text: string) => void) {
    this.ocrInterval = setInterval(async () => {
      if (!this.videoRef) return
      const { text, confidence } = await OCRService.extractTextFromFrame(this.videoRef)
      const cleaned = OCRService.cleanText(text)
      if (OCRService.isUsable(cleaned, confidence)) {
        this.log(`👁 OCR captured ${cleaned.length} chars (confidence: ${confidence.toFixed(0)}%)`)
        onContext(cleaned)
      }
    }, OCR_INTERVAL_MS)
  }

  stopOCRLoop() {
    if (this.ocrInterval) {
      clearInterval(this.ocrInterval)
      this.ocrInterval = null
    }
  }

  async runInterview(
    studentName: string,
    projectName: string,
    videoElement: HTMLVideoElement
  ): Promise<FeedbackReport> {
    this.videoRef = videoElement
    const questionAnswers: QuestionAnswer[] = []
    let ocrContext = ''

    this.log(`🚀 Interview started for ${studentName} — ${projectName}`)
    this.startOCRLoop((text) => {
      ocrContext = text
      this.onStateChange({ ocrContext: text })
    })

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const previousQAs = questionAnswers
        .map(qa => `Q: ${qa.question.text}\nA: ${qa.answer.transcript}`)
        .join('\n\n')

      this.onStateChange({ status: 'loading', currentQuestionIndex: i })
      this.log(`⏳ Question ${i + 1}: waiting for OCR context...`)

      const questionText = await LLMService.generateQuestion(
        ocrContext || 'Student is presenting their project',
        i,
        previousQAs,
        (msg) => this.log(msg)
      )

      const question: Question = {
        id: i,
        text: questionText,
        context: ocrContext,
        askedAt: Date.now()
      }

      // Push the question to chat state IMMEDIATELY, before TTS speaks
      const currentQuestions = [...questionAnswers.map(qa => qa.question), question]
      this.onStateChange({
        status: 'questioning',
        questions: currentQuestions,
      })

      this.log(`🗣 Speaking: "${questionText.slice(0, 60)}..."`)
      await this.tts.speak(questionText)

      this.onStateChange({ status: 'listening' })
      this.log(`👂 Listening for student answer...`)

      let transcript = ''
      try {
        transcript = await this.stt.listen(4000, 60000)
        this.log(`💬 Answer received: "${transcript.slice(0, 60)}..."`)
      } catch {
        transcript = 'No answer provided'
        this.log(`⚠️ No answer detected`)
      }

      const answer: Answer = {
        questionId: i,
        transcript,
        answeredAt: Date.now()
      }

      this.onStateChange({ status: 'evaluating' })
      const { score, feedback } = await LLMService.evaluateAnswer(
        questionText,
        transcript,
        ocrContext,
        (msg) => this.log(msg)
      )

      questionAnswers.push({ question, answer, score, feedback })

      this.onStateChange({
        questions: questionAnswers.map(qa => qa.question),
        answers: questionAnswers.map(qa => qa.answer),
      })
    }

    this.stopOCRLoop()
    this.log(`📊 All questions done, generating report...`)

    this.onStateChange({ status: 'evaluating' })
    const qaSummary = questionAnswers
      .map(qa => `Q: ${qa.question.text}\nA: ${qa.answer.transcript}\nScore: ${qa.score}/25`)
      .join('\n\n')

    const reportData = await LLMService.generateReport(
      qaSummary,
      projectName,
      (msg) => this.log(msg)
    )

    const scores: EvaluationScores = {
      technicalDepth: reportData.scores.technicalDepth,
      clarityOfExplanation: reportData.scores.clarityOfExplanation,
      originality: reportData.scores.originality,
      implementationUnderstanding: reportData.scores.implementationUnderstanding
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)

    const report: FeedbackReport = {
      studentName,
      projectName,
      totalScore,
      scores,
      questionAnswers,
      strengths: reportData.strengths,
      improvements: reportData.improvements,
      summary: reportData.summary,
      generatedAt: Date.now()
    }

    this.log(`✅ Report complete! Total score: ${totalScore}/100`)
    this.onStateChange({ status: 'complete', report })
    return report
  }

  cleanup() {
    this.stopOCRLoop()
    this.tts.stop()
    this.stt.stop()
    if (this.videoRef?.srcObject) {
      const stream = this.videoRef.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }
}
