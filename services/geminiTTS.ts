import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing. Check VITE_GEMINI_API_KEY.");

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
          response_format: "base64", // ✅ Changed to Base64
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
      
      // 1. Check for URL
      const audioUrl = data.url || data.audio_url;
      if (audioUrl) {
        const audioRes = await fetch(audioUrl);
        const arrayBuffer = await audioRes.arrayBuffer();
        return await decodeAudioData(arrayBuffer);
      }

      // 2. Check for Base64 (Ye naya part hai)
      // API 'data', 'audio_content', 'audio', ya 'base64' key bhej sakta hai
      const base64String = data.data || data.audio_content || data.audio || data.base64;
      
      if (base64String) {
        // Base64 string ko AudioBuffer mein convert karna
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      }

      // 3. Agar kuch na mile, to Response print karo error mein
      console.error("Unknown API Response:", data);
      throw new Error(`API Response Unknown: ${JSON.stringify(data)}`);

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
