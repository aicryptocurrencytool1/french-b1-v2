// Vercel Edge Function for DeepSeek Proxy - Stability Focus
// Edge Runtime allows up to 30s execution time.

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY is not set.');
        return new Response(JSON.stringify({ error: 'DeepSeek API key missing on server' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        const bodyContent = await req.json();

        // Edge functions have a 25-30s timeout limit.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 seconds

        console.log('Forwarding request to DeepSeek...');
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'French-B1-App',
            },
            body: JSON.stringify(bodyContent),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Standard JSON handling to ensure the client receives a valid object
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepSeek API error ${response.status}:`, errorText);
            return new Response(errorText, {
                status: response.status,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error('DeepSeek Proxy Exception:', error.name, error.message);

        let status = 500;
        let message = error.message;

        if (error.name === 'AbortError') {
            status = 504;
            message = 'DeepSeek API took too long to respond (28s+). Falling back to Gemini.';
        }

        return new Response(JSON.stringify({ error: 'DeepSeek Proxy Error', details: message }), {
            status,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
