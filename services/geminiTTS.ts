import { decodeAudioData } from '../utils/audioUtils';
import { VOICE_OPTIONS, MAX_TEXT_LENGTH } from '../constants';
// Hum standard imports use karenge taaki koi package error na aaye

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {
  
  // Main Function jo App.tsx call karta hai
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      throw new Error("API Key missing. Please check Vercel settings.");
    }

    const text = typeof params === 'string' ? params : params.text;

    // STEP 1: Pehle DeAPI (Kokoro) Try karte hain
    try {
      console.log("Attempting DeAPI TTS...");
      return await this.generateWithDeAPI(text);
    } catch (deapiError) {
      console.warn("DeAPI failed, switching to Google Gemini Backup...", deapiError);
      
      // STEP 2: Agar DeAPI fail hua, to Google Gemini use karenge
      // (Aapke diye gaye "High Fidelity" prompt ke saath)
      return await this.generateWithGemini(params);
    }
  }

  // --- DeAPI Logic (Primary) ---
  private async generateWithDeAPI(text: string): Promise<AudioBuffer> {
    const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        text: text,
        model: "Kokoro",
        voice: "af_alloy", // Default voice
        response_format: "url"
      })
    });

    if (!response.ok) {
      throw new Error(`DeAPI Status: ${response.status}`);
    }

    const data = await response.json();
    const audioUrl = data.url || data.audio_url;
    
    if (!audioUrl) throw new Error("DeAPI No URL returned");

    const audioResponse = await fetch(audioUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();
    
    // Aapke utils folder wala decode function
    return await decodeAudioData(arrayBuffer);
  }

  // --- Google Gemini Logic (Backup - Aapka Code) ---
  private async generateWithGemini(params: any): Promise<AudioBuffer> {
    const text = typeof params === 'string' ? params : params.text;
    
    // Voice Selection Logic
    const voiceId = params.voiceId || 'Puck'; // Default fallback
    const voice = VOICE_OPTIONS?.find((v: any) => v.id === voiceId) || { prebuiltVoice: 'Puck' };

    // --- Aapka High Quality Prompt Logic ---
    let instructions = "AUDIO FIDELITY PROTOCOL: This is a high-end studio recording. Output must be 100% pure, crystal clear, and completely silent in the background. ABSOLUTELY NO white noise, no room reverb, no hiss, no static, and no digital artifacts. The voice must sound realistic, warm, and professional with natural human-like cadence. ";
    
    if (params.speed > 1.3) instructions += "The speaker is talking at a fast, energetic pace. ";
    else if (params.speed < 0.8) instructions += "The speaker is talking at a slow, deliberate pace. ";
    
    if (params.emotion) {
      instructions += `The speaker is currently feeling ${params.emotion} - let that emotion naturally flow through the voice acting. `;
    }

    const finalPrompt = `${instructions.trim()} Say exactly this: ${text}`;

    // Hum direct REST API call karenge taaki kisi SDK ki zarurat na pade (Error proof)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice.prebuiltVoice || "Puck" }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Base64 decoding logic
    const candidate = data.candidates?.[0];
    let base64Audio = candidate?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("Gemini did not return audio data");
    }

    // Convert Base64 to ArrayBuffer manually to avoid dependency issues
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await decodeAudioData(bytes.buffer);
  }
}

// ✅ FINAL FIX: Ye line App.tsx ke error ko hatayegi
export const ttsService = new TTSService();
