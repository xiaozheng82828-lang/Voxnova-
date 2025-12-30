import { decodeAudioData } from '../utils/audioUtils';

export class TTSService {
  
  // Helper: Audio string dhoondhne ke liye
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

  // Helper: Wait function
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

      // Check for immediate errors
      if (data.error) throw new Error(`Server Error: ${data.error}`);

      // 2. Check for Ticket (request_id)
      let requestId = null;
      if (data.data && data.data.request_id) requestId = data.data.request_id;
      if (!requestId) {
         const jsonStr = JSON.stringify(data);
         const match = jsonStr.match(/"request_id":"(.*?)"/);
         if (match) requestId = match[1];
      }

      // 3. Polling (Agar Ticket mila)
      if (requestId) {
        console.log("Queued. ID:", requestId);
        
        // ✅ CHANGE: Loop badha diya (60 attempts x 2 sec = 120 seconds / 2 minutes)
        for (let i = 0; i < 60; i++) {
           await this.wait(2000); // 2 second ruko

           console.log(`Checking status... Attempt ${i+1}/60`);
           const pollRes = await fetch('/api/tts', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ request_id: requestId })
           });
           
           data = await pollRes.json();
           
           // Agar status 'failed' aa jaye to ruk jao
           if (data.status === 'failed' || data.error) {
             throw new Error("Audio generation failed on server.");
           }

           // Agar Audio mil gaya to loop todo
           if (this.findAudioString(data)) {
             console.log("Audio Received!");
             break;
           }
        }
      }

      // 4. Final Processing
      const audioSource = this.findAudioString(data);
      
      if (!audioSource) {
        // Agar 2 minute baad bhi nahi mila
        throw new Error("Server is too busy. Audio timed out after 2 minutes.");
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
      // Friendly error message
      if (e.message.includes("Unexpected token")) {
        throw new Error("Network Error. Please check connection.");
      }
      throw e;
    }
  }
}

export const ttsService = new TTSService();
