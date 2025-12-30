// api/tts.js
export default async function handler(req, res) {
  const { text, request_id } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Server Key missing" });

  try {
    let url = 'https://api.deapi.ai/api/v1/client/txt2audio';
    
    // ✅ FIX: Required fields wapas add kar diye
    let body = {
        text: text,
        model: "Kokoro",
        voice: "af_alloy",
        response_format: "base64",
        lang: "en-us",
        format: "wav",
        speed: 1,           // Ye field zaroori hai
        sample_rate: 24000  // Ye bhi zaroori hai
    };

    // Agar hum status check kar rahe hain (Polling)
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
    
    if (!response.ok) {
        // Agar ab bhi error aaye, to frontend ko batao
        return res.status(response.status).json({ 
            error: data.message || "API Error", 
            details: data 
        });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
