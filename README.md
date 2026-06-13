# AI Interviewer

A fully client-side AI-powered technical interviewer. It watches a student's screen share, reads code and content via OCR, asks adaptive technical questions via voice, listens to spoken answers, scores responses, and generates a structured feedback report — all running locally with no external API keys.

> Built for **Challenge 2: AI-Driven Automated Interviewer for Project Presentations**

---

## ✨ Features

- 🖥 **Live screen capture** — share any window/tab via `getDisplayMedia()`
- 👁 **Client-side OCR** — reads code, slides, diagrams every 5 seconds via Tesseract.js
- 🤖 **Adaptive question generation** — context-aware questions based on what's on screen and previous answers, powered by a locally running LLM (Ollama)
- 🗣 **Text-to-Speech** — questions are spoken aloud (Web Speech API)
- 🎤 **Speech-to-Text** — answers captured via voice, with automatic silence detection and a manual "Done Answering" control
- 📊 **Structured evaluation** — scores across Technical Depth, Clarity of Explanation, Originality, and Implementation Understanding
- 📋 **Feedback report** — strengths, improvements, per-question breakdown, and overall grade
- 📄 **PDF export** — download the full report as a polished PDF
- 🌗 **Light/dark theme toggle** — persisted across sessions
- 🔍 **Live logs panel** — see what's happening under the hood in real time
- 🔒 **100% local** — no API keys, no backend, no data leaves your machine

---

## 🛠 Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Plain CSS with CSS variables (light/dark theming) |
| OCR | [Tesseract.js](https://github.com/naptha/tesseract.js) |
| STT / TTS | Web Speech API (browser native) |
| Screen capture | `getDisplayMedia()` |
| LLM | [Ollama](https://ollama.com) running locally — `phi3:mini` |
| PDF export | jsPDF + html2canvas |

---

## 🏗 Architecture

```
Browser Tab
├── React App (Vite dev server)
│   ├── useInterview hook — single source of truth for session state
│   ├── InterviewService — orchestrates the full interview loop
│   ├── LLMService — talks to Ollama's local REST API
│   ├── OCRService — Tesseract.js frame extraction
│   ├── STTService — Web Speech API wrapper (listen/stop)
│   └── TTSService — speechSynthesis wrapper
│
└── Ollama (localhost:11434)
    └── phi3:mini model (CPU inference)
```

### Data flow

1. `getDisplayMedia()` streams the shared window into a hidden `<video>` element
2. Every 5 seconds, a frame is captured and run through Tesseract.js OCR
3. The cleaned OCR text + previous Q&A is sent to `phi3:mini` to generate the next question
4. The question is spoken aloud via `speechSynthesis`
5. `SpeechRecognition` listens for the spoken answer (auto-stops after 4s of silence, capped at 60s, or ended manually via "Done Answering")
6. The answer is sent to `phi3:mini` for scoring + feedback
7. Steps 3–6 repeat for 5 questions
8. A final LLM call generates the structured report (scores, strengths, improvements, summary)
9. The report renders in the UI with an option to download as PDF

No backend, no database — all session state lives in React `useState` for the duration of the interview.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running locally

### 1. Install and run Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull phi3:mini
```

Ollama runs automatically as a local service on `http://localhost:11434`.

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`).

---

## 🎬 Using the App

1. Enter your name and project name on the landing screen
2. Click **Begin Interview** — you'll be prompted to share a screen/window (choose the **window** showing your project, e.g. an IDE, Google Docs, or slides)
3. The AI will:
   - Read your screen via OCR every 5 seconds
   - Ask you 5 adaptive questions about what it sees, speaking each one aloud
   - Listen to your spoken answer (click **Done Answering** to finish early)
   - Score and give feedback on each answer
4. After 5 questions, a final report is generated showing your overall score, breakdown, strengths, improvements, and a per-question summary
5. Click **Download PDF** to save the report, or **New Interview** to start over
6. Toggle 🔍 **Logs** in the chat panel to see real-time processing logs
7. Use the ☀️/🌙 icon to switch between light and dark themes

---

## ⚙️ Configuration

No environment variables or `.env` file required. The Ollama endpoint is set in `src/services/llm.service.ts`:

```ts
const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = 'phi3:mini'
```

To use a different local model, change `MODEL` and run `ollama pull <model>` first.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── FeedbackReport.tsx        # Final report UI + PDF export
│   ├── InterviewChat.tsx         # Chat + logs panel
│   ├── ReportGeneratingOverlay.tsx
│   ├── ScreenCapture.tsx         # Video feed display
│   ├── StatusIndicator.tsx
│   └── ThemeToggle.tsx
├── hooks/
│   ├── useInterview.ts           # Session state + orchestration entry point
│   └── useTheme.ts                # Light/dark theme persistence
├── services/
│   ├── interview.service.ts      # Core interview loop
│   ├── llm.service.ts            # Ollama integration
│   ├── ocr.service.ts            # Tesseract.js wrapper
│   ├── stt.service.ts            # Speech-to-text
│   └── tts.service.ts            # Text-to-speech
├── types/
│   └── interview.types.ts
├── App.tsx
└── index.css
```

---

## 🔐 Privacy & Compliance

- No API keys used or required
- No data sent to any external server — OCR, STT, TTS, and the LLM all run on the local machine
- Ollama serves the model over `localhost` only

---

## 🐛 Known Limitations

- LLM response time depends on local hardware (CPU inference with `phi3:mini` takes ~5–10s per call)
- OCR accuracy depends on screen resolution, font size, and zoom level of the shared window
- Web Speech API support/quality varies by browser (best in Chrome/Edge)

---

## 📄 License

Built for hackathon evaluation purposes.