//  Screen & OCR

export interface OCRResult {
  text: string
  confidence: number
  timestamp: number
}

//  Speech

export interface SpeechResult {
  transcript: string
  isFinal: boolean
  timestamp: number
}

//  Interview

export type InterviewStatus =
  | 'idle'
  | 'loading'
  | 'capturing'
  | 'questioning'
  | 'listening'
  | 'evaluating'
  | 'complete'

export interface Question {
  id: number
  text: string
  context: string        // what OCR text triggered this question
  askedAt: number
}

export interface Answer {
  questionId: number
  transcript: string
  answeredAt: number
}

export interface QuestionAnswer {
  question: Question
  answer: Answer
  score: number          // 0-25 per question, 5 questions = 100 total
  feedback: string
}

//  Evaluation

export interface EvaluationScores {
  technicalDepth: number       // 0-25
  clarityOfExplanation: number // 0-25
  originality: number          // 0-25
  implementationUnderstanding: number // 0-25
}

export interface FeedbackReport {
  studentName: string
  projectName: string
  totalScore: number           // 0-100
  scores: EvaluationScores
  questionAnswers: QuestionAnswer[]
  strengths: string[]
  improvements: string[]
  summary: string
  generatedAt: number
}

//  Interview Session

export interface InterviewSession {
  status: InterviewStatus
  currentQuestionIndex: number
  totalQuestions: number       // fixed at 5
  ocrContext: string           
  questions: Question[]
  answers: Answer[]
  report: FeedbackReport | null
}
