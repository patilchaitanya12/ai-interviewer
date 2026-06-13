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
const OCR_INTERVAL_MS = 5000 // capture screen every 5 seconds

export class InterviewService {
  private tts: TTSService
  private stt: STTService
  private ocrInterval: ReturnType<typeof setInterval> | null = null
  private videoRef: HTMLVideoElement | null = null
  private onStateChange: (session: Partial<InterviewSession>) => void

  constructor(onStateChange: (session: Partial<InterviewSession>) => void) {
    this.tts = new TTSService()
    this.stt = new STTService()
    this.onStateChange = onStateChange
  }

  // Screen Capture

  async startScreenCapture(): Promise<HTMLVideoElement> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 5 }, // low framerate,as we are going with ss
      audio: false
    })

    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    await new Promise(resolve => video.onloadedmetadata = resolve)
    this.videoRef = video
    return video
  }

  // OCR Loop 

  startOCRLoop(onContext: (text: string) => void) {
    this.ocrInterval = setInterval(async () => {
      if (!this.videoRef) return
      const { text, confidence } = await OCRService.extractTextFromFrame(this.videoRef)
      const cleaned = OCRService.cleanText(text)
      if (OCRService.isUsable(cleaned, confidence)) {
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

  // Core Interview Loop

  async runInterview(
    studentName: string,
    projectName: string,
    videoElement: HTMLVideoElement
  ): Promise<FeedbackReport> {
    this.videoRef = videoElement
    const questionAnswers: QuestionAnswer[] = []
    let ocrContext = ''

    // Start capturing screen context in background
    this.startOCRLoop((text) => { ocrContext = text })

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      // 1. Build previous QA context string for LLM
      const previousQAs = questionAnswers
        .map(qa => `Q: ${qa.question.text}\nA: ${qa.answer.transcript}`)
        .join('\n\n')

      // 2. Generate question
      this.onStateChange({ status: 'loading', currentQuestionIndex: i })
      const questionText = await LLMService.generateQuestion(
        ocrContext || 'Student is presenting their project',
        i,
        previousQAs
      )

      const question: Question = {
        id: i,
        text: questionText,
        context: ocrContext,
        askedAt: Date.now()
      }

      // 3. Speak question aloud
      this.onStateChange({ status: 'questioning' })
      await this.tts.speak(questionText)

      // 4. Listen to student answer
      this.onStateChange({ status: 'listening' })
      let transcript = ''
      try {
        transcript = await this.stt.listen()
      } catch {
        transcript = 'No answer provided'
      }

      const answer: Answer = {
        questionId: i,
        transcript,
        answeredAt: Date.now()
      }

      // 5. Evaluate answer
      this.onStateChange({ status: 'evaluating' })
      const { score, feedback } = await LLMService.evaluateAnswer(
        questionText,
        transcript,
        ocrContext
      )

      questionAnswers.push({ question, answer, score, feedback })
    }

    // 6. Stop OCR loop
    this.stopOCRLoop()

    // 7. Generate final report
    this.onStateChange({ status: 'evaluating' })
    const qaSummary = questionAnswers
      .map(qa => `Q: ${qa.question.text}\nA: ${qa.answer.transcript}\nScore: ${qa.score}/25`)
      .join('\n\n')

    const reportData = await LLMService.generateReport(qaSummary, projectName)

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

    this.onStateChange({ status: 'complete', report })
    return report
  }

  // Cleanup

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
