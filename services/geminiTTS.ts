import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // ✅ Request both URL and Base64 friendly format
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
          response_format: "url", // URL maangte hain (Safe & Fast)
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
      
      // --- 🕵️‍♂️ AUTO-DISCOVERY ENGINE (Naam nahi, Data dhoondo) ---
      
      let audioSource: string | null = null;
      let sourceType = "none";

      // Helper function: Kya ye Audio jaisa dikhta hai?
      const checkValue = (val: any) => {
        if (typeof val !== 'string') return null;
        if (val.startsWith('http')) return 'url'; // URL mila!
        if (val.length > 500) return 'base64';    // Badi string = Base64!
        return null;
      }

      // 1. Root level check
      for (const key in data) {
        const type = checkValue(data[key]);
        if (type) { audioSource = data[key]; sourceType = type; break; }
      }

      // 2. Data Object level check (Aapka Case!)
      if (!audioSource && data.data && typeof data.data === 'object') {
        const innerData = data.data;
        // Array case
        if (Array.isArray(innerData)) {
             if (innerData[0]) {
                 for (const key in innerData[0]) {
                     const type = checkValue(innerData[0][key]);
                     if (type) { audioSource = innerData[0][key]; sourceType = type; break; }
                 }
             }
        } 
        // Object case (Ye wala!)
        else {
             for (const key in innerData) {
                 const type = checkValue(innerData[key]);
                 if (type) { audioSource = innerData[key]; sourceType = type; break; }
             }
        }
      }

      // Agar ab bhi nahi mila, to saari keys dikhao taaki humein naam pata chale
      if (!audioSource) {
        let keysFound = Object.keys(data).join(", ");
        if (data.data && typeof data.data === 'object') {
            keysFound += " | Inside DATA: " + Object.keys(data.data).join(", ");
        }
        throw new Error(`AUDIO KEYS MISSING. Found Keys: [ ${keysFound} ]`);
      }

      console.log(`Audio Found! Type: ${sourceType}`);

      // --- DECODING ---

      if (sourceType === 'url') {
        const audioRes = await fetch(audioSource);
        const arrayBuffer = await audioRes.arrayBuffer();
        return await decodeAudioData(arrayBuffer);
      } 
      else {
        // Base64 Cleaning
        const cleanBase64 = audioSource.replace(/^data:audio\/[a-z]+;base64,/, "").replace(/\s/g, "");
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
