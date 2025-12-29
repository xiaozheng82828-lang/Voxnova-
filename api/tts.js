// api/tts.js
export default async function handler(req, res) {
  const { text } = req.body;
  // Note: Vercel server environment variable use kar raha hai
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server Key missing" });
  }

  try {
    // 1. Call DeAPI (Correct Endpoint)
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
        format: "mp3",
        speed: 1,
        sample_rate: 24000  // ✅ FIXED: Ye field missing thi
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`DeAPI Error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();

    // 2. Data Hunt (Nested Objects se audio nikalna)
    let base64String = null;

    if (data.data && typeof data.data === 'string') base64String = data.data;
    else if (data.base64) base64String = data.base64;
    else if (data.data && typeof data.data === 'object') {
        // Nested keys check
        base64String = data.data.base64 || data.data.audio || data.data.data;
    }

    if (!base64String) {
        throw new Error(`Audio data missing in JSON. Keys: ${Object.keys(data).join(", ")}`);
    }

    // 3. Cleaning & Sending Audio
    const cleanBase64 = base64String.replace(/^data:audio\/[a-z0-9]+;base64,/, "").replace(/\s/g, "");
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
