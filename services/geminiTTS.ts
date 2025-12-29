import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // ✅ Back to 'base64' (Kyunki URL format me data nahi mil raha)
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
          response_format: "base64", // Ye zaroori hai
          lang: "en-us",
          format: "mp3",
          sample_rate: 24000,
          speed: 1
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      
      // --- 🕵️‍♂️ DRILL DOWN ENGINE (Data ko khod ke nikalo) ---
      
      let finalAudioString: string | null = null;
      let foundPath = "none";

      // Function jo check karega ki ye string audio hai ya nahi
      const isAudioString = (val: any) => typeof val === 'string' && val.length > 100;

      // 1. Direct Check
      if (isAudioString(data.data)) {
        finalAudioString = data.data;
        foundPath = "data.data";
      }
      else if (isAudioString(data.base64)) {
        finalAudioString = data.base64;
        foundPath = "data.base64";
      }
      // 2. Deep Check (Agar data object hai)
      else if (data.data && typeof data.data === 'object') {
        // Nested keys check karo
        const inner = data.data;
        if (isAudioString(inner.base64)) { finalAudioString = inner.base64; foundPath = "data.data.base64"; }
        else if (isAudioString(inner.audio)) { finalAudioString = inner.audio; foundPath = "data.data.audio"; }
        else if (isAudioString(inner.data)) { finalAudioString = inner.data; foundPath = "data.data.data"; }
      }

      // 3. Agar ab bhi na mile, to ERROR dikhao (par JSON ke sath)
      if (!finalAudioString) {
        // Hum pura JSON stringify karke error me dikhayenge taaki structure dikh jaye
        const jsonPreview = JSON.stringify(data).substring(0, 300);
        throw new Error(`AUDIO STRING NOT FOUND. JSON RECEIVED: ${jsonPreview}`);
      }

      console.log(`Audio Found at: ${foundPath}`);

      // --- CLEANING & DECODING ---
      // Prefix hatana (data:audio/mp3;base64, ...)
      const cleanBase64 = finalAudioString.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");

      try {
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      } catch (e) {
        throw new Error("Decoding Failed. String was invalid base64.");
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
