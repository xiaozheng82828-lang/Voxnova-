import { decodeAudioData } from '../utils/audioUtils';

// Note: Ensure Vercel variable name is VITE_GEMINI_API_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      console.error("API Key missing in Vercel!");
      throw new Error("API Key missing. Please check VITE_GEMINI_API_KEY in Vercel settings.");
    }

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
          voice: "af_alloy",     // Default Voice
          response_format: "url",
          lang: "en-us",         // ✅ FIXED: Bhasha batana zaroori tha
          speed: 1               // Optional: Normal speed
        })
      });

      if (!response.ok) {
        // Error details print karte hain taaki pata chale kya issue hai
        const errorData = await response.json().catch(() => ({}));
        console.error("DeAPI Error Details:", errorData);
        throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const audioUrl = data.url || data.audio_url;

      if (!audioUrl) throw new Error("DeAPI ne Audio URL nahi diya");

      // Audio download karke play karna
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
