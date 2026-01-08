// Vercel Serverless Function to proxy DeepSeek API calls
// Optimized for stability and timeout handling

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

    // Set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 seconds timeout for Hobby plan (10s limit)

    try {
        // Handle body correctly
        const bodyContent = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        console.log('Forwarding request to DeepSeek...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: bodyContent,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            console.error('DeepSeek Error Response:', response.status, data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Proxy Exception:', error.name, error.message);

        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: 'DeepSeek Gateway Timeout',
                message: 'DeepSeek API took too long to respond (9s+). Falling back to Gemini.'
            });
        }

        return res.status(500).json({
            error: 'Failed to communicate with DeepSeek',
            message: error.message
        });
    }
}
