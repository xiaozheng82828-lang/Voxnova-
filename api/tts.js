// api/tts.js
export default async function handler(req, res) {
  const { text } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Server Key missing" });

  try {
    // 1. WAV Format use kar rahe hain (Kyunki ye Instant milta hai)
    const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
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
        format: "wav",       // ✅ FIXED: MP3 hata kar WAV kiya (Synchronous)
        speed: 1,
        sample_rate: 24000
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();

    // 2. Smart Search (JSON me kahin bhi string dhoondho jo 100+ chars ki ho)
    const findAudioString = (obj) => {
        if (!obj) return null;
        // Agar string hai aur badi hai (matlab base64 ya url hai)
        if (typeof obj === 'string' && obj.length > 100) return obj;
        
        // Agar object hai to andar jhak kar dekho
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
        // Agar ab bhi na mile, to pura JSON error me dikhao
        throw new Error(`Audio missing. Full Response: ${JSON.stringify(data)}`);
    }

    // 3. Process & Send (URL ya Base64 handle karna)
    let finalBuffer;
    
    if (audioSource.startsWith('http')) {
        // Agar URL hai to download karo
        const urlRes = await fetch(audioSource);
        const arrayBuf = await urlRes.arrayBuffer();
        finalBuffer = Buffer.from(arrayBuf);
    } else {
        // Agar Base64 hai to clean karke convert karo
        const cleanBase64 = audioSource.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");
        finalBuffer = Buffer.from(cleanBase64, 'base64');
    }

    // Frontend ko Audio bhej do
    res.setHeader('Content-Type', 'audio/wav');
    res.send(finalBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
