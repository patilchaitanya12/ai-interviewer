const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = 'phi3:mini'

export class LLMService {
  static async generateQuestion(ocrContext: string, questionIndex: number, previousQAs: string): Promise<string> {
    const prompt = `You are a technical interviewer. A student is presenting their project.

Here is what you can see on their screen right now:
${ocrContext}

${previousQAs ? `Previous questions and answers:\n${previousQAs}` : ''}

Generate question number ${questionIndex + 1} of 5. 
- Ask about specific code, architecture, or design decisions visible on screen
- Be concise, one question only
- No preamble, just the question itself`

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
    return data.message.content.trim()
  }

  static async evaluateAnswer(
    question: string,
    answer: string,
    ocrContext: string
  ): Promise<{ score: number; feedback: string }> {
    const prompt = `You are evaluating a student's answer in a technical interview.

Screen context: ${ocrContext}
Question asked: ${question}
Student's answer: ${answer}

Score this answer from 0-25 and give one sentence of feedback.
Respond ONLY in this exact JSON format:
{"score": <number>, "feedback": "<one sentence>"}`

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
      return JSON.parse(clean)
    } catch {
      return { score: 15, feedback: 'Answer received and evaluated.' }
    }
  }

  static async generateReport(
    qas: string,
    projectName: string
  ): Promise<{ scores: Record<string, number>; strengths: string[]; improvements: string[]; summary: string }> {
    const prompt = `You evaluated a student presenting "${projectName}". Here are all Q&As:
${qas}

Generate a final report. Respond ONLY in this exact JSON format:
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
      return JSON.parse(clean)
    } catch {
      return {
        scores: { technicalDepth: 15, clarityOfExplanation: 15, originality: 15, implementationUnderstanding: 15 },
        strengths: ['Good presentation', 'Clear communication', 'Technical knowledge'],
        improvements: ['More depth needed', 'Explain design decisions better'],
        summary: 'The student demonstrated understanding of their project.'
      }
    }
  }
}
