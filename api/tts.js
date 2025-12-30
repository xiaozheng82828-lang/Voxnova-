// api/tts.js
export default async function handler(req, res) {
  const { text, request_id } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Server Key missing" });

  try {
    let url = 'https://api.deapi.ai/api/v1/client/txt2audio';
    
    // ✅ SIMPLIFIED BODY: Speed aur Sample Rate hata diya (Safe Mode)
    let body = {
        text: text,
        model: "Kokoro",
        voice: "af_alloy",
        response_format: "base64",
        lang: "en-us",
        format: "wav" // WAV hi rakhenge
    };

    // Polling Request
    if (request_id) {
        url = 'https://api.deapi.ai/api/v1/client/retrieve';
        body = { request_id: request_id };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    // Server status code bhi check karte hain
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || "Upstream API Error", details: data });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
