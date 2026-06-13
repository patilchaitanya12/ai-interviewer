export class TTSService {
  private synth: SpeechSynthesis
  private voice: SpeechSynthesisVoice | null = null

  constructor() {
    this.synth = window.speechSynthesis

    // Wait for voices to load then pick best English voice
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoice()
    }
    this.loadVoice()
  }

  private loadVoice() {
    const voices = this.synth.getVoices()
    // Prefer natural sounding English voices
    this.voice =
      voices.find(v => v.name.includes('Google US English')) ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0] ||
      null
  }

  // Speak text, returns promise that resolves when done speaking
  speak(text: string, rate: number = 0.95): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel anything currently speaking
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.voice
      utterance.rate = rate    // 0.95 = slightly slower than default, clearer
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => resolve()
      utterance.onerror = (e) => reject(e)

      this.synth.speak(utterance)
    })
  }

  // Stop speaking immediately
  stop() {
    this.synth.cancel()
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window
  }
}
