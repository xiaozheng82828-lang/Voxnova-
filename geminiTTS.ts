
import { GoogleGenAI } from "@google/genai";
import { TTSRequest, Emotion } from '../types';
import { VOICE_OPTIONS, MAX_TEXT_LENGTH } from '../constants';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

export class TTSService {
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error.message?.match(/status: (\d+)/)?.[1] || "";
        const isRateLimit = status === "429" || error.message?.includes("RESOURCE_EXHAUSTED");
        const isTransient = status === "500" || status === "503" || status === "504";

        if ((isRateLimit || isTransient) && i < maxRetries) {
          // Exponential backoff: 2s, 4s...
          const delay = Math.pow(2, i + 1) * 1000;
          console.warn(`TTS Synthesis attempt ${i + 1} failed (${status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async generateSpeech(params: TTSRequest): Promise<AudioBuffer> {
    const voice = VOICE_OPTIONS.find(v => v.id === params.voiceId);
    if (!voice) throw new Error("Invalid voice selected");

    if (params.text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text exceeds the maximum single-synthesis limit of ${MAX_TEXT_LENGTH} characters.`);
    }

    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Ultra-strong studio quality and noise cancellation prompt
      let instructions = "AUDIO FIDELITY PROTOCOL: This is a high-end studio recording. Output must be 100% pure, crystal clear, and completely silent in the background. ABSOLUTELY NO white noise, no room reverb, no hiss, no static, and no digital artifacts. The voice must sound realistic, warm, and professional with natural human-like cadence and subtle, realistic breathing patterns. ";
      
      if (params.speed > 1.3) instructions += "The speaker is talking at a fast, energetic pace. ";
      else if (params.speed < 0.8) instructions += "The speaker is talking at a slow, deliberate pace. ";
      
      if (params.pitch > 3) instructions += "The voice has a naturally higher resonance. ";
      else if (params.pitch < -3) instructions += "The voice has a naturally deeper, resonant tone. ";

      if (params.emotion && params.emotion !== Emotion.NONE) {
        instructions += `The speaker is currently feeling ${params.emotion} - let that emotion naturally flow through the voice acting. `;
      }

      if (voice.persona) {
          instructions += voice.persona + " ";
      }

      const finalPrompt = `${instructions.trim()} Say exactly this: ${params.text}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: { 
            parts: [{ text: finalPrompt }] 
          },
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice.prebuiltVoice },
              },
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          },
        });

        if (!response.candidates || response.candidates.length === 0) {
          throw new Error("No candidates returned from AI.");
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
          throw new Error("Synthesis rejected or content blocked by safety filters.");
        }

        let base64Data: string | undefined;
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Data = part.inlineData.data;
            break;
          }
        }

        if (!base64Data) {
          const textPart = candidate.content.parts.find(p => p.text);
          if (textPart) {
             throw new Error(`The model returned text instead of audio: ${textPart.text.substring(0, 100)}...`);
          }
          throw new Error("No audio stream detected in the response.");
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const uint8Data = decodeBase64(base64Data);
        return await decodeAudioData(uint8Data, audioCtx, 24000, 1);
      } catch (error: any) {
        // Detailed error classification
        if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Rate limit exceeded or API quota reached. Please wait a minute before trying again.");
        }
        if (error.message?.includes("500") || error.message?.includes("503")) {
          throw new Error("The synthesis engine is momentarily overloaded. Retrying automatically...");
        }
        throw error;
      }
    });
  }
}

export const ttsService = new TTSService();
