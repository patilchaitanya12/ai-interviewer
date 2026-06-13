import Tesseract from 'tesseract.js'

export class OCRService {
  // this takes a video element or canvas snapshot and extracts text
  static async extractTextFromFrame(
    source: HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ text: string; confidence: number }> {
    // Draw current video frame onto a canvas to get image data
    const canvas = document.createElement('canvas')
    
    if (source instanceof HTMLVideoElement) {
      canvas.width = source.videoWidth
      canvas.height = source.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(source, 0, 0)
    } else {
      canvas.width = source.width
      canvas.height = source.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(source, 0, 0)
    }

    const { data } = await Tesseract.recognize(canvas, 'eng', {
      logger: () => {} // suppress tesseract logs
    })

    return {
      text: data.text.trim(),
      confidence: data.confidence
    }
  }

  // Cleans up OCR noise
  static cleanText(raw: string): string {
    return raw
      .replace(/[^\x20-\x7E\n]/g, '') // keep only printable ASCII
      .replace(/\n{3,}/g, '\n\n')      // collapse excessive newlines
      .replace(/\s{3,}/g, ' ')         // collapse excessive spaces
      .trim()
  }

  // This only returns text if confidence is high enough to be useful
  static isUsable(text: string, confidence: number): boolean {
    return confidence > 40 && text.length > 20
  }
}
