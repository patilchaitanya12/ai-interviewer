export class STTService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private manualStopRequested: boolean = false

  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error('SpeechRecognition not supported')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1
  }

  listen(silenceMs: number = 4000, maxDurationMs: number = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('SpeechRecognition not supported')
        return
      }

      let finalTranscript = ''
      let silenceTimer: ReturnType<typeof setTimeout> | null = null
      let maxTimer: ReturnType<typeof setTimeout> | null = null
      let settled = false
      this.manualStopRequested = false

      const cleanup = () => {
        if (silenceTimer) clearTimeout(silenceTimer)
        if (maxTimer) clearTimeout(maxTimer)
        this.recognition!.onresult = null
        this.recognition!.onend = null
        this.recognition!.onerror = null
      }

      const finish = (value: string) => {
        if (settled) return
        settled = true
        cleanup()
        this.isListening = false
        resolve(value.trim() || 'No answer provided')
      }

      const armSilenceTimer = () => {
        if (silenceTimer) clearTimeout(silenceTimer)
        silenceTimer = setTimeout(() => {
          this.recognition!.stop()
        }, silenceMs)
      }

      maxTimer = setTimeout(() => {
        this.recognition!.stop()
      }, maxDurationMs)

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        armSilenceTimer()
      }

      this.recognition.onend = () => {
        finish(finalTranscript)
      }

      this.recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          finish(finalTranscript || 'No answer provided')
        } else {
          cleanup()
          this.isListening = false
          settled = true
          reject(event.error)
        }
      }

      armSilenceTimer()

      this.isListening = true
      this.recognition.start()
    })
  }

  /** Manually stop listening early — resolves the in-flight listen() promise */
  stopAndResolve() {
    if (this.recognition && this.isListening) {
      this.manualStopRequested = true
      this.recognition.stop()
    }
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
