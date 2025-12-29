import { decodeAudioData } from '../utils/audioUtils';
import { VOICE_OPTIONS } from '../constants';

// NOTE: Vite me 'process.env' nahi chalta, 'import.meta.env' chalta hai
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    // Debugging ke liye: Check karein key aayi ya nahi
    if (!API_KEY) {
      console.error("Vercel Env Var check failed. Name should be VITE_GEMINI_API_KEY");
      throw new Error("API Key missing! Vercel Settings me variable ka naam 'VITE_GEMINI_API_KEY' rakhein.");
    }

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech with DeAPI...");

    try {
      // DeAPI Call (Direct Fetch)
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
          response_format: "url"
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`DeAPI Error: ${response.status} - ${errData.message || ''}`);
      }

      const data = await response.json();
      const audioUrl = data.url || data.audio_url;

      if (!audioUrl) throw new Error("DeAPI ne Audio URL nahi diya");

      // Audio Download & Decode
      const audioRes = await fetch(audioUrl);
      const arrayBuffer = await audioRes.arrayBuffer();
      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Error:", error);
      throw error;
    }
  }
}

// Ye export zaroori hai taaki App.tsx error na de
export const ttsService = new TTSService();
