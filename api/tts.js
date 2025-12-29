// api/tts.js
export default async function handler(req, res) {
  const { text } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server Key missing" });
  }

  try {
    // 1. Wapas wahi address use kar rahe hain jo WORK kar raha tha
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
        response_format: "base64", // Base64 mangayenge
        lang: "en-us",
        format: "mp3",
        speed: 1
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();

    // 2. Data Hunt (Server side par dhundhna aasan hai)
    // Hum check karenge ki audio string kahan chupi hai
    let base64String = null;

    if (data.data && typeof data.data === 'string') base64String = data.data;
    else if (data.base64) base64String = data.base64;
    else if (data.data && typeof data.data === 'object') {
        // Nested object check (Aapka wala case!)
        base64String = data.data.base64 || data.data.audio || data.data.data;
    }

    if (!base64String) {
        throw new Error(`Audio data not found in JSON: ${JSON.stringify(data).substring(0, 100)}...`);
    }

    // 3. Cleaning & Converting to Binary
    // Prefix hatana (agar ho to)
    const cleanBase64 = base64String.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");
    
    // Binary Buffer banana
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    // 4. Audio bhej do!
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
