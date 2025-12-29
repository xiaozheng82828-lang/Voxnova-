import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Hum Class bana rahe hain kyunki App.tsx yahi chahta hai
class TTSService {
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      throw new Error("API Key missing. Please check Vercel settings.");
    }

    // Text nikalna
    const text = typeof params === 'string' ? params : params.text;

    try {
      // DeAPI (Kokoro Model) request
      const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          text: text,
          model: "Kokoro",       // DeAPI ka model
          voice: "af_alloy",     // Voice style
          response_format: "url" // URL mangwa rahe hain
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const audioUrl = data.url || data.audio_url;

      if (!audioUrl) {
        throw new Error("API ne audio URL wapas nahi kiya");
      }

      // Audio download aur decode karna
      const audioResponse = await fetch(audioUrl);
      const arrayBuffer = await audioResponse.arrayBuffer();
      
      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Error:", error);
      throw error;
    }
  }
}

// ✅ YE SABSE ZAROORI LINE HAI:
// App.tsx yahi 'ttsService' dhoond raha tha jo missing tha.
export const ttsService = new TTSService();
