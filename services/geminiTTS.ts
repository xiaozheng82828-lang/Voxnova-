import { decodeAudioData } from '../utils/audioUtils';
import { VOICE_OPTIONS, MAX_TEXT_LENGTH } from '../constants';

// VITE_ prefix wala variable use kar rahe hain
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class TTSService {

  // Main function
  async generateSpeech(params: any): Promise<AudioBuffer> {
    if (!API_KEY) {
      // Ye error tab aayega agar Vercel me naam 'VITE_' se shuru nahi hoga
      throw new Error("API Key missing. Vercel me variable ka naam 'VITE_GEMINI_API_KEY' rakhein.");
    }

    const text = typeof params === 'string' ? params : params.text;

    // --- STEP 1: DeAPI (Primary) ---
    try {
      console.log("Using DeAPI...");
      return await this.generateWithDeAPI(text);
    } catch (deapiError) {
      console.warn("DeAPI failed, switching to Google Gemini...", deapiError);
      
      // --- STEP 2: Google Gemini (Backup) ---
      return await this.generateWithGemini(params);
    }
  }

  // DeAPI Logic
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
        voice: "af_alloy",
        response_format: "url"
      })
    });

    if (!response.ok) throw new Error(`DeAPI Error: ${response.status}`);

    const data = await response.json();
    const audioUrl = data.url || data.audio_url;
    
    if (!audioUrl) throw new Error("DeAPI ne URL nahi diya");

    const audioResponse = await fetch(audioUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();
    return await decodeAudioData(arrayBuffer);
  }

  // Google Gemini Logic (Using Fetch to avoid package errors)
  private async generateWithGemini(params: any): Promise<AudioBuffer> {
    const text = typeof params === 'string' ? params : params.text;
    const voiceId = params.voiceId || 'Puck';
    const voice = VOICE_OPTIONS?.find((v: any) => v.id === voiceId) || { prebuiltVoice: 'Puck' };

    // High Quality Prompt
    let instructions = "AUDIO FIDELITY PROTOCOL: Studio quality, crystal clear, no background noise. ";
    if (params.emotion) instructions += `Emotion: ${params.emotion}. `;
    const finalPrompt = `${instructions} Say: ${text}`;

    // Direct API Call (No SDK needed)
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

    if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);

    const data = await response.json();
    const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) throw new Error("No audio data from Gemini");

    // Decode Base64
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await decodeAudioData(bytes.buffer);
  }
}

// ✅ Fix for "ttsService is not exported"
export const ttsService = new TTSService();
