import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Hum Class structure wapas la rahe hain taaki App.tsx khush rahe
export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      throw new Error("API Key missing. Please check Vercel settings.");
    }

    // Text nikalna (kabhi direct string aata hai, kabhi object)
    const text = typeof params === 'string' ? params : params.text;

    try {
      // DeAPI (Kokoro Model) se connect karna
      const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          text: text,            
          model: "Kokoro",       // DeAPI ka model
          voice: "af_alloy",     // Voice name
          response_format: "url" // URL maang rahe hain
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `DeAPI Error: ${response.status}`);
      }

      const data = await response.json();
      
      // DeAPI se URL nikalna
      const audioUrl = data.url || data.audio_url;
      if (!audioUrl) throw new Error("API ne audio URL nahi diya");

      // URL se audio download karke process karna
      const audioResponse = await fetch(audioUrl);
      const arrayBuffer = await audioResponse.arrayBuffer();
      
      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Error:", error);
      throw error;
    }
  }
}

// ✅ YE HAI FIX: Hum class ka instance bana kar export kar rahe hain
// App.tsx yahi 'ttsService' dhoond raha tha
export const ttsService = new TTSService();
