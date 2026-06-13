export interface OCRResult {
  text: string
  confidence: number
  timestamp: number
}

export interface SpeechResult {
  transcript: string
  isFinal: boolean
  timestamp: number
}

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
  context: string
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
  score: number
  feedback: string
}

export interface EvaluationScores {
  technicalDepth: number
  clarityOfExplanation: number
  originality: number
  implementationUnderstanding: number
}

export interface FeedbackReport {
  studentName: string
  projectName: string
  totalScore: number
  scores: EvaluationScores
  questionAnswers: QuestionAnswer[]
  strengths: string[]
  improvements: string[]
  summary: string
  generatedAt: number
}

export interface InterviewSession {
  status: InterviewStatus
  currentQuestionIndex: number
  totalQuestions: number
  ocrContext: string
  questions: Question[]
  answers: Answer[]
  logs: string[]           
  report: FeedbackReport | null
}
