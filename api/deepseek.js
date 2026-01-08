// Vercel Serverless Function to proxy DeepSeek API calls
// This bypasses CORS and keeps the API key secure (not exposed to the browser)

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'DeepSeek API key not configured on server' });
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepSeek API returned error ${response.status}:`, errorText);
            return res.status(response.status).json({ error: `DeepSeek Error: ${response.status}`, details: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error proxying to DeepSeek:', error);
        return res.status(500).json({ error: 'Failed to communicate with DeepSeek', details: error.message });
    }
}
