// api/tts.js
export default async function handler(req, res) {
  const { text, request_id } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Server Key missing" });

  try {
    let url = 'https://api.deapi.ai/api/v1/client/txt2audio';
    let body = {
        text: text,
        model: "Kokoro",
        voice: "af_alloy",
        response_format: "base64",
        lang: "en-us",
        format: "wav", // WAV fast hota hai
        speed: 1,
        sample_rate: 24000
    };

    // Agar hum status check kar rahe hain (Polling Request)
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

    // Server bas data forward kar dega (Wait nahi karega)
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
