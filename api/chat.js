import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    // 1. Catch bad methods early
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { conversationHistory } = req.body;

        // 2. The Fix: Fetch the PDF from your own live Vercel domain
        // This avoids Vercel's local file system restrictions entirely.
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const pdfUrl = `${protocol}://${host}/form_b101.pdf`;
        
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF from ${pdfUrl}`);
        }
        
        const arrayBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

        // 3. Inject the PDF into the system instruction
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

        // 4. Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: contents,
        });

        // 5. Send successful JSON back to the frontend
        res.status(200).json({ reply: response.text });

    } catch (error) {
        console.error("Server Error Details:", error);
        // Explicitly return a JSON error so the frontend parser doesn't crash
        res.status(500).json({ error: 'Failed to process request on the server.' });
    }
}