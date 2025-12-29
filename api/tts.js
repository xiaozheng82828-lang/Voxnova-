// api/tts.js
// Ye server-side code hai, yahan CORS ka problem nahi hota
export default async function handler(req, res) {
  // Browser se text lete hain
  const { text } = req.body;
  
  // Vercel se Key uthate hain
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key missing on server" });
  }

  try {
    // DeAPI Standard Endpoint (Jo browser me fail ho raha tha, yahan chalega)
    const apiResponse = await fetch('https://api.deapi.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "kokoro",
        input: text,
        voice: "af_alloy",
        response_format: "mp3" // Humein seedha MP3 chahiye
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`DeAPI Error: ${apiResponse.status}`);
    }

    // Audio data convert karke wapas bhejte hain
    const arrayBuffer = await apiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
          }
