// Vercel Serverless Function to proxy DeepSeek API calls
// This bypasses CORS and keeps the API key secure (not exposed to the browser)

// Increase timeout for Vercel Pro plans (default is 10s for Hobby)
export const config = {
    maxDuration: 60, // 60 seconds max timeout
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'DeepSeek API key not configured on server' });
    }

    console.log('Proxying request to DeepSeek API...');

    try {
        // Use AbortController for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(req.body),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepSeek API returned error ${response.status}:`, errorText);
            return res.status(response.status).json({ error: `DeepSeek Error: ${response.status}`, details: errorText });
        }

        const data = await response.json();
        console.log('DeepSeek API call successful');
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error proxying to DeepSeek:', error.name, error.message);

        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'DeepSeek request timed out', details: 'The request took too long' });
        }

        return res.status(500).json({ error: 'Failed to communicate with DeepSeek', details: error.message });
    }
}
