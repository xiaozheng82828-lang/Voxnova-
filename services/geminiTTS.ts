import { decodeAudioData } from '../utils/audioUtils';

// Hum Vercel mein variable ka naam same rakhenge taaki confusion na ho
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateSpeech = async (params: any): Promise<AudioBuffer> => {
  if (!API_KEY) {
    throw new Error("API Key missing. Please check Vercel settings.");
  }

  // Text nikalna (kabhi direct string aata hai, kabhi object)
  const text = typeof params === 'string' ? params : params.text;

  try {
    // Ye DeAPI ka OpenAI-Compatible endpoint hai
    const response = await fetch('https://api.deapi.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "kokoro",       // DeAPI ka fast model
        input: text,           // DeAPI 'input' field mangta hai (Google 'text' mangta tha)
        voice: "af_alloy",     // Default voice (Aap 'af_bella' ya 'af_sarah' bhi try kar sakte hain)
        response_format: "mp3" // Audio format
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `DeAPI Error: ${response.status}`);
    }

    // Audio data (Blob) nikalna
    const arrayBuffer = await response.arrayBuffer();
    
    // Aapke utils folder wala function use karke decode kar rahe hain
    return await decodeAudioData(arrayBuffer);

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
