import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // We just take the pre-packaged history (which now includes the PDF) 
        // and hand it straight to Gemini.
        const { conversationHistory } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: conversationHistory,
        });

        res.status(200).json({ reply: response.text });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'Failed to process request on the server.' });
    }
}