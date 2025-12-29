import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      throw new Error("API Key missing. Check VITE_GEMINI_API_KEY in Vercel settings.");
    }

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // ✅ Sabhi required fields ek saath
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
          response_format: "url",
          lang: "en-us",         // Language
          format: "wav",         // Format
          sample_rate: 24000,    // Quality
          speed: 1               // ✅ NEW: Speed field add kar diya (1 = Normal speed)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("DeAPI Error Details:", JSON.stringify(errorData));
        throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const audioUrl = data.url || data.audio_url;

      if (!audioUrl) throw new Error("DeAPI ne Audio URL nahi diya");

      const audioRes = await fetch(audioUrl);
      const arrayBuffer = await audioRes.arrayBuffer();
      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
