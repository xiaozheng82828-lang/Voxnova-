import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

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
          response_format: "b64_json", // Base64 is safer
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
      
      // --- 🕵️‍♂️ DEEP SEARCH ENGINE ---
      // Hum ek helper function banayenge jo audio keys dhoondhega
      const findAudioKey = (obj: any) => {
        if (!obj) return null;
        return obj.b64_json || obj.audio_content || obj.url || obj.audio_url || obj.data || obj.base64;
      };

      let targetString = null;
      let foundType = "None";

      // 1. Check Root Level
      targetString = findAudioKey(data);
      if (targetString && typeof targetString === 'string') foundType = "Root";

      // 2. Check Inside 'data' Object (Ye aapka case hai!)
      if (!targetString && data.data) {
        if (Array.isArray(data.data) && data.data[0]) {
          // Case: Array format [ { b64_json: ... } ]
          targetString = findAudioKey(data.data[0]);
          foundType = "Data Array[0]";
        } else if (typeof data.data === 'object') {
          // Case: Object format { request_id: ..., url: ... }
          targetString = findAudioKey(data.data);
          foundType = "Data Object";
        } else if (typeof data.data === 'string') {
          // Case: Direct string
          targetString = data.data;
          foundType = "Direct String";
        }
      }

      if (!targetString || typeof targetString !== 'string') {
        const preview = JSON.stringify(data).substring(0, 200);
        throw new Error(`AUDIO NOT FOUND in JSON. Preview: ${preview}...`);
      }

      console.log(`Audio found in: ${foundType}`);

      // --- HANDLING: URL vs Base64 ---
      
      // Agar ye URL hai (http se shuru hota hai)
      if (targetString.startsWith('http')) {
        const audioRes = await fetch(targetString);
        const arrayBuffer = await audioRes.arrayBuffer();
        return await decodeAudioData(arrayBuffer);
      }

      // Agar ye Base64 hai (Clean karke decode karo)
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
        throw new Error(`Decoding Failed. Data start: ${cleanBase64.substring(0, 30)}...`);
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
