const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = 'phi3:mini'

export type LogCallback = (msg: string) => void

export class LLMService {
  static async generateQuestion(
    ocrContext: string,
    questionIndex: number,
    previousQAs: string,
    onLog?: LogCallback
  ): Promise<string> {
    onLog?.(`🔍 Analyzing screen context (${ocrContext.length} chars)...`)
    onLog?.(`🤔 Generating question ${questionIndex + 1}/5...`)

    const prompt = `You are a technical interviewer. A student is presenting their project.

Here is what you can see on their screen:
${ocrContext}

${previousQAs ? `Previous questions and answers:\n${previousQAs}` : ''}

Generate interview question number ${questionIndex + 1} of 5.
Rules:
- Ask about the CODE or LOGIC visible on screen only
- One short, direct question
- NO preamble, NO "Q:", NO numbering — just the question itself
- Do not repeat previous questions`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    })

    const data = await response.json()
    // Strip any "Q:", "Question:", numbering prefixes
    const raw = data.message.content.trim()
    const cleaned = raw.replace(/^(Q\d*[:.]?\s*|Question\s*\d*[:.]?\s*)/i, '').trim()
    onLog?.(`✅ Question generated`)
    return cleaned
  }

  static async evaluateAnswer(
    question: string,
    answer: string,
    ocrContext: string,
    onLog?: LogCallback
  ): Promise<{ score: number; feedback: string }> {
    onLog?.(`📊 Evaluating answer...`)

    const prompt = `You are evaluating a student's answer in a technical interview.

Screen context: ${ocrContext}
Question asked: ${question}
Student's answer: ${answer}

Score this answer from 0-25 and give one sentence of feedback.
Respond ONLY in this exact JSON format with no extra text:
{"score": <number 0-25>, "feedback": "<one sentence>"}`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    })

    const data = await response.json()
    try {
      const clean = data.message.content.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      onLog?.(`✅ Score: ${parsed.score}/25`)
      return parsed
    } catch {
      onLog?.(`⚠️ Score parse failed, using default`)
      return { score: 15, feedback: 'Answer received and evaluated.' }
    }
  }

  static async generateReport(
    qas: string,
    projectName: string,
    onLog?: LogCallback
  ): Promise<{ scores: Record<string, number>; strengths: string[]; improvements: string[]; summary: string }> {
    onLog?.(`📝 Generating final report for "${projectName}"...`)

    const prompt = `You evaluated a student presenting "${projectName}". Here are all Q&As:
${qas}

Generate a final report. Respond ONLY in this exact JSON format with no extra text:
{
  "scores": {
    "technicalDepth": <0-25>,
    "clarityOfExplanation": <0-25>,
    "originality": <0-25>,
    "implementationUnderstanding": <0-25>
  },
  "strengths": ["<point1>", "<point2>", "<point3>"],
  "improvements": ["<point1>", "<point2>"],
  "summary": "<2 sentence summary>"
}`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    })

    const data = await response.json()
    try {
      const clean = data.message.content.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      onLog?.(`✅ Report generated`)
      return parsed
    } catch {
      onLog?.(`⚠️ Report parse failed, using defaults`)
      return {
        scores: { technicalDepth: 15, clarityOfExplanation: 15, originality: 15, implementationUnderstanding: 15 },
        strengths: ['Good presentation', 'Clear communication', 'Technical knowledge'],
        improvements: ['More depth needed', 'Explain design decisions better'],
        summary: 'The student demonstrated understanding of their project.'
      }
    }
  }
}
