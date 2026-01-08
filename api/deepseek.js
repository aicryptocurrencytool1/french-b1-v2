// Vercel Serverless Function to proxy DeepSeek API calls
// Enhanced version with body handling and error logging

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY is missing');
        return res.status(500).json({ error: 'DeepSeek API key not configured on server' });
    }

    try {
        // Vercel parses req.body automatically if it's JSON.
        // We need to re-stringify it for the external fetch.
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        console.log('Calling DeepSeek API...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: body,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('DeepSeek Error:', response.status, data);
            return res.status(response.status).json(data || { error: 'Unknown DeepSeek Error' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy Exception:', error.name, error.message);
        return res.status(500).json({
            error: 'Failed to communicate with DeepSeek',
            message: error.message,
            stack: error.stack
        });
    }
}
