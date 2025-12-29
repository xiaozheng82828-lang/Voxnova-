import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing. Check Vercel settings.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // ✅ Request 'b64_json' (Standard AI Format)
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
          format: "mp3",
          sample_rate: 24000,
          speed: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // --- 🕵️‍♂️ UNIVERSAL FINDER (Asli Magic Yahan Hai) ---
      let targetString: string | null = null;
      let sourceType = "Unknown";

      // Case 1: OpenAI Standard Format (Array ke andar)
      if (data.data && Array.isArray(data.data) && data.data[0]?.b64_json) {
        targetString = data.data[0].b64_json;
        sourceType = "OpenAI Array Format";
      }
      // Case 2: Direct Keys
      else if (data.b64_json) {
        targetString = data.b64_json;
        sourceType = "Direct b64_json";
      }
      // Case 3: URL Format
      else if (data.url || data.audio_url) {
        const url = data.url || data.audio_url;
        console.log("Downloading from URL:", url);
        const audioRes = await fetch(url);
        const arrayBuffer = await audioRes.arrayBuffer();
        return await decodeAudioData(arrayBuffer);
      }
      // Case 4: Kabhi kabhi data.data seedha string hota hai
      else if (typeof data.data === 'string') {
        targetString = data.data;
        sourceType = "Direct Data String";
      }

      // --- DEBUG MODE: Agar ab bhi nahi mila, to JSON dikhao ---
      if (!targetString) {
        // Hum response ka thoda hissa print karenge taaki error box me dikhe
        const jsonPreview = JSON.stringify(data).substring(0, 200); 
        throw new Error(`DATA STRUCTURE ERROR. Received JSON: ${jsonPreview}...`);
      }

      console.log(`Audio Data Found via: ${sourceType}`);

      // Cleaning & Decoding
      // Kabhi kabhi 'data:audio...' prefix laga hota hai, use hatana zaroori hai
      const cleanBase64 = targetString.replace(/^data:audio\/[a-z]+;base64,/, "").replace(/\s/g, "");

      try {
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      } catch (e) {
        throw new Error(`Decoding Failed. String start: ${cleanBase64.substring(0, 30)}...`);
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
