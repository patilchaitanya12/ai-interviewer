export class STTService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false

  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition //SpeechRecognition is for standard and webkitSpeechRecognition is for Chrome

    if (!SpeechRecognition) {
      console.error('SpeechRecognition not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
  }

  // Returns a promise that resolves when student stops speaking
  listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('SpeechRecognition not supported')
        return
      }

      let finalTranscript = ''

      this.recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }
      }

      // Auto-stop after 3 seconds of silence
      this.recognition.onspeechend = () => {
        this.recognition!.stop()
      }

      this.recognition.onend = () => {
        this.isListening = false
        resolve(finalTranscript.trim() || 'No answer provided')
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        reject(event.error)
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
