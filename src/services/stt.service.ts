export class STTService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false

  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error('SpeechRecognition not supported')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false  // changed to false — stops cleanly after one response
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1
  }

  listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('SpeechRecognition not supported')
        return
      }

      let finalTranscript = ''
      let silenceTimer: ReturnType<typeof setTimeout> | null = null

      const done = () => {
        if (silenceTimer) clearTimeout(silenceTimer)
        this.recognition!.onresult = null
        this.recognition!.onend = null
        this.recognition!.onerror = null
        resolve(finalTranscript.trim() || 'No answer provided')
      }

      this.recognition.onresult = (event) => {
        // Reset silence timer on every result
        if (silenceTimer) clearTimeout(silenceTimer)

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }

        // Auto-resolve after 2.5s of silence post speech
        silenceTimer = setTimeout(() => {
          this.recognition!.stop()
        }, 2500)
      }

      this.recognition.onend = () => {
        this.isListening = false
        done()
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        if (event.error === 'no-speech') {
          resolve('No answer provided')
        } else {
          reject(event.error)
        }
      }

      this.isListening = true
      this.recognition.start()
    })
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }
}
