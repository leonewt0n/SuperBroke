import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { conversationHistory, message, currentViewBase64 } = req.body;

    // 1. Reconstruct the payload
    // We take the existing text history and add the user's NEW message,
    // appending the screenshot of the page they are currently looking at.
    const contents = [...conversationHistory];

    contents.push({
      role: "user",
      parts: [
        { text: message },
        {
          inlineData: {
            data: currentViewBase64, // The JPEG image string
            mimeType: "image/jpeg",
          },
        },
      ],
    });

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });

    // 3. Return the text reply
    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Server Error Details:", error);
    res.status(500).json({ error: "Failed to process request on the server." });
  }
}
