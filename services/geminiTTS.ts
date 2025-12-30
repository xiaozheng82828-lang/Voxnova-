import { decodeAudioData } from '../utils/audioUtils';

export class TTSService {
  
  // Helper: Data me Audio dhoondne ke liye
  private findAudioString(obj: any): string | null {
     if (!obj) return null;
     if (typeof obj === 'string' && obj.length > 100) return obj;
     if (typeof obj === 'object') {
        for (const key in obj) {
           const found = this.findAudioString(obj[key]);
           if (found) return found;
        }
     }
     return null;
  }

  // Helper: Wait karne ke liye
  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateSpeech(params: any): Promise<AudioBuffer> {
    const text = typeof params === 'string' ? params : params.text;
    console.log("Calling Server...");

    try {
      // 1. Server ko request bhejo
      let response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      let data = await response.json();

      // 2. Check karo: Kya server ne "Ticket" (request_id) diya?
      let requestId = null;
      if (data.data && data.data.request_id) requestId = data.data.request_id;
      // Kabhi kabhi structure alag hota hai, deep check:
      if (!requestId) {
         // Simple check: agar data me 'request_id' key kahin bhi hai
         const jsonStr = JSON.stringify(data);
         const match = jsonStr.match(/"request_id":"(.*?)"/);
         if (match) requestId = match[1];
      }

      // 3. Agar Ticket mila, to Browser wait karega (Polling)
      if (requestId) {
        console.log("Queued. ID:", requestId, "- Waiting in browser...");
        
        // 15 baar try karenge (30 seconds tak)
        for (let i = 0; i < 15; i++) {
           await this.wait(2000); // 2 second ruko

           console.log(`Checking status... (${i+1})`);
           const pollRes = await fetch('/api/tts', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ request_id: requestId })
           });
           
           data = await pollRes.json();
           
           // Agar Audio mil gaya to loop todo
           if (this.findAudioString(data)) {
             console.log("Audio Received!");
             break;
           }
        }
      }

      // 4. Audio nikal kar Play karo
      const audioSource = this.findAudioString(data);
      
      if (!audioSource) {
        throw new Error("Audio timeout. Server gave no audio.");
      }

      // Base64 Clean & Decode
      const cleanBase64 = audioSource.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return await decodeAudioData(bytes.buffer);

    } catch (e: any) {
      console.error("TTS Error:", e);
      // Agar HTML error aaye to user ko batao
      if (e.message && e.message.includes("Unexpected token")) {
        throw new Error("Server Crash. Please redeploy or check API Key.");
      }
      throw e;
    }
  }
}

export const ttsService = new TTSService();
