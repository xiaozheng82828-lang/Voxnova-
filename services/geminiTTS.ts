import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) throw new Error("API Key missing. Check Vercel settings.");

    const text = typeof params === 'string' ? params : params.text;
    console.log("Generating speech via DeAPI...");

    try {
      // Hum 'url' format mangayenge kyunki wo sabse safe hai
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
          response_format: "url", // ✅ URL best hai (errors kam aate hain)
          lang: "en-us",
          format: "wav",
          sample_rate: 24000,
          speed: 1
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`DeAPI Status ${response.status}: ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      
      // --- LAYER 1: Agar URL mila to wahin se le lo (Best Case) ---
      const audioUrl = data.url || data.audio_url;
      if (audioUrl) {
        console.log("Audio URL Found:", audioUrl);
        const audioRes = await fetch(audioUrl);
        const arrayBuffer = await audioRes.arrayBuffer();
        return await decodeAudioData(arrayBuffer);
      }

      // --- LAYER 2: Agar Base64 mila (Fallback) ---
      let rawData = data.data || data.audio_content || data.audio || data.base64;
      
      if (!rawData) {
        console.error("Empty Response:", data);
        throw new Error("API ne na URL diya, na Audio data.");
      }

      // ✅ FIX: "replace is not a function" error yahan fix hoga
      // Hum check kar rahe hain ki ye sach mein String hai ya nahi
      if (typeof rawData !== 'string') {
        console.warn("Received data is not a string, converting...", typeof rawData);
        // Agar ye object ya array hai, to hum ise string mein convert karenge
        rawData = String(rawData); 
      }

      // Ab replace karna safe hai
      const base64String = rawData
        .replace(/^data:audio\/[a-z]+;base64,/, "")
        .replace(/\s/g, "");

      try {
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await decodeAudioData(bytes.buffer);
      } catch (e) {
        console.error("Decoding Failed. Data start:", base64String.substring(0, 50));
        throw new Error("Audio decoding failed. Format sahi nahi tha.");
      }

    } catch (error) {
      console.error("TTS Process Failed:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
