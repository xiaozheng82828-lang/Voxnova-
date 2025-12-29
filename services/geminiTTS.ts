import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI Standard...");

    try {
      // ✅ CHANGE: Hum Standard OpenAI Endpoint use karenge
      // Ye endpoint sabse reliable hai aur seedha Audio deta hai
      const response = await fetch('https://api.deapi.ai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "kokoro",       // Model wahi rahega
          input: text,           // Note: Yahan 'text' ki jagah 'input' likhte hain
          voice: "af_alloy",
          response_format: "mp3" // Direct MP3 file mangayenge
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      // ✅ SIMPLE LOGIC:
      // Ab humein JSON parse karne ki zarurat nahi.
      // Response seedha 'Audio File' hai.
      const arrayBuffer = await response.arrayBuffer();
      
      // Check karein ki data khali to nahi hai
      if (arrayBuffer.byteLength < 100) {
        throw new Error("Audio file empty aayi hai.");
      }

      return await decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
