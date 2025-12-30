import { decodeAudioData } from '../utils/audioUtils';

export class TTSService {
  
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

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateSpeech(params: any): Promise<AudioBuffer> {
    const text = typeof params === 'string' ? params : params.text;
    console.log("Starting TTS Process...");

    try {
      // 1. Initial Request
      let response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      let data = await response.json();

      if (data.error) throw new Error(`Server Error: ${data.error}`);

      // 2. Check for Ticket
      let requestId = null;
      if (data.data && data.data.request_id) requestId = data.data.request_id;
      if (!requestId) {
         const jsonStr = JSON.stringify(data);
         const match = jsonStr.match(/"request_id":"(.*?)"/);
         if (match) requestId = match[1];
      }

      // 3. Polling
      if (requestId) {
        console.log("Queued. ID:", requestId);
        
        // 60 attempts (2 minutes)
        for (let i = 0; i < 60; i++) {
           await this.wait(2000); 

           console.log(`Checking status... ${i+1}/60`);
           const pollRes = await fetch('/api/tts', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ request_id: requestId })
           });
           
           data = await pollRes.json();
           
           // ✅ ERROR HANDLING: Agar fail hua to REASON dikhao
           if (data.status === 'failed') {
             const reason = data.error || data.message || JSON.stringify(data);
             throw new Error(`Server Failed: ${reason}`);
           }

           if (this.findAudioString(data)) {
             console.log("Audio Received!");
             break;
           }
        }
      }

      // 4. Processing
      const audioSource = this.findAudioString(data);
      
      if (!audioSource) {
        // Agar audio nahi mila to aakhri response dikhao
        const debugInfo = JSON.stringify(data).substring(0, 100);
        throw new Error(`Audio timeout. Last status: ${debugInfo}...`);
      }

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
      throw e; // Asli error user ko dikhao
    }
  }
}

export const ttsService = new TTSService();
