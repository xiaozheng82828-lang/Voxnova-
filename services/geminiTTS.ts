import { decodeAudioData } from '../utils/audioUtils';

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    const text = typeof params === 'string' ? params : params.text;
    console.log("Calling Vercel Proxy for TTS...");

    try {
      // ✅ AB HUM APNE KHUD KE SERVER SE BAAT KARENGE
      // Ye '/api/tts' us 'api/tts.js' file ko call karega jo humne abhi banayi
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Server Error: ${err.error || response.statusText}`);
      }

      // Server ne humein saaf-suthra MP3 bheja hai
      const arrayBuffer = await response.arrayBuffer();
      
      // Check agar file khali hai
      if (arrayBuffer.byteLength < 100) {
        throw new Error("Empty audio received from server");
      }

      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
