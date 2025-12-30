// api/tts.js
export default async function handler(req, res) {
  const { text } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Server Key missing" });

  // Helper: 2 second wait karne ke liye
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // 1. Pehli Request Bhejo
    console.log("Sending TTS request...");
    let response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text: text,
        model: "Kokoro",
        voice: "af_alloy",
        response_format: "base64",
        lang: "en-us",
        format: "wav",
        speed: 1,
        sample_rate: 24000
      })
    });

    let data = await response.json();

    // 2. CHECK: Kya server ne Ticket (request_id) diya?
    // Data structure check: data.data.request_id
    let requestId = null;
    if (data.data && data.data.request_id) {
      requestId = data.data.request_id;
    }

    // 3. Agar Ticket mila, to Polling shuru karo (Loop)
    if (requestId) {
      console.log(`Queued! Request ID: ${requestId}. Polling started...`);
      
      // 10 baar try karenge (matlab 20-30 seconds tak wait karenge)
      for (let i = 0; i < 15; i++) {
        await wait(2000); // 2 second ruko

        // Status check karo
        const pollRes = await fetch('https://api.deapi.ai/api/v1/client/retrieve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ request_id: requestId })
        });

        const pollData = await pollRes.json();
        
        // Agar status 'processing' nahi hai, matlab shayad audio aa gaya
        // Hum check karenge ki kya naye data me audio hai
        if (pollData.data && (pollData.data.base64 || pollData.data.url)) {
            data = pollData; // Data update kar do
            console.log("Polling success! Audio received.");
            break; // Loop todo
        }
        console.log(`Waiting... Attempt ${i+1}`);
      }
    }

    // 4. Ab Audio Dhoondo (Chahe pehle mila ho ya polling ke baad)
    const findAudioString = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string' && obj.length > 100) return obj;
        if (typeof obj === 'object') {
            for (const key in obj) {
                const found = findAudioString(obj[key]);
                if (found) return found;
            }
        }
        return null;
    };

    const audioSource = findAudioString(data);

    if (!audioSource) {
        throw new Error(`Audio creation timed out or failed. Final Response: ${JSON.stringify(data)}`);
    }

    // 5. Cleaning & Sending
    let finalBuffer;
    if (audioSource.startsWith('http')) {
        const urlRes = await fetch(audioSource);
        const arrayBuf = await urlRes.arrayBuffer();
        finalBuffer = Buffer.from(arrayBuf);
    } else {
        const cleanBase64 = audioSource.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");
        finalBuffer = Buffer.from(cleanBase64, 'base64');
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.send(finalBuffer);

  } catch (error) {
    console.error("TTS Server Error:", error);
    res.status(500).json({ error: error.message || "Unknown Server Error" });
  }
}
