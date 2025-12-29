import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // ✅ CHANGE 1: 'b64_json' aur 'mp3' use kar rahe hain (Zyada reliable)
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
          response_format: "b64_json", 
          lang: "en-us",
          format: "mp3",      // MP3 is safer for web
          sample_rate: 24000,
          speed: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // ✅ CHANGE 2: Sahi jagah data dhoondna
      // Standard OpenAI format 'b64_json' hota hai, par hum baki bhi check karenge
      let rawData = data.b64_json || data.audio_content || data.data || data.audio;

      // --- DETECTIVE MODE START ---
      // Agar data nahi mila ya galat format mein hai, to Error Box mein sach batao
      if (!rawData) {
        throw new Error(`Data missing! Keys received: ${Object.keys(data).join(", ")}`);
      }

      if (typeof rawData !== 'string') {
        // Agar ye Text nahi hai (Object/Array hai), to humein pata chal jayega
        throw new Error(`Wrong Data Type: Received ${typeof rawData}. Expected String.`);
      }
      // --- DETECTIVE MODE END ---

      // Cleaning
      const base64String = rawData.replace(/^data:audio\/[a-z]+;base64,/, "").replace(/\s/g, "");

      try {
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      } catch (e) {
        // Agar ab bhi fail ho, to data ka shuruati hissa dikhao
        throw new Error(`Decoding Failed. Data Start: ${base64String.substring(0, 20)}...`);
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
