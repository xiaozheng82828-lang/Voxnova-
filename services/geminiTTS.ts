
import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          text: text,
          model: "Kokoro",
          voice: "af_alloy",
          response_format: "base64", // Hum Base64 hi mangayenge
          lang: "en-us",
          format: "wav",
          sample_rate: 24000,
          speed: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // API alag-alag naam se data bhej sakta hai, sab check kar lete hain
      let rawBase64 = data.data || data.audio_content || data.audio || data.base64 || data.url;

      if (!rawBase64) {
        console.error("API Response Full:", data);
        throw new Error("API ne empty response diya. Console logs check karein.");
      }

      // ✅ CLEANER: Prefix (data:audio/wav;base64,) aur spaces hatana
      const base64String = rawBase64
        .replace(/^data:audio\/[a-z]+;base64,/, "") // Prefix hataya
        .replace(/\s/g, ""); // Spaces/Newlines hataye

      try {
        // Ab clean string ko decode karein
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      } catch (e) {
        console.error("Decoding Failed. Raw Data:", rawBase64);
        throw new Error("Audio data corrupt tha, decode nahi ho paya.");
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
