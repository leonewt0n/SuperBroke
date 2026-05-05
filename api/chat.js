import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Vercel automatically injects your GEMINI_API_KEY environment variable here
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { conversationHistory } = req.body;

        // 1. Locate and read the PDF file from the 'public' directory
        const filePath = path.join(process.cwd(), 'public', 'form_b101.pdf');
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfBase64 = pdfBuffer.toString('base64');

        // 2. Inject the PDF into the system instruction (the first message in the history)
        const contents = [...conversationHistory];
        contents[0] = {
            role: 'user',
            parts: [
                { text: contents[0].parts[0].text },
                {
                    inlineData: {
                        data: pdfBase64,
                        mimeType: 'application/pdf'
                    }
                }
            ]
        };

        // 3. Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: contents,
        });

        // 4. Return the AI's text to the frontend
        res.status(200).json({ reply: response.text });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'Failed to process request on the server.' });
    }
}