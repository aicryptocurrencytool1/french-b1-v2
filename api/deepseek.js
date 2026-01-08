// Vercel Edge Function for DeepSeek Proxy - Time-Safe Version
// Ensures a response is returned within Vercel's 25s window.

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
        return new Response(JSON.stringify({ error: 'DeepSeek API key missing on server' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        const bodyContent = await req.json();

        // Vercel Edge MUST return a response within 25 seconds.
        // We set our timeout to 22 seconds to be safe.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 22000);

        console.log('Fetching DeepSeek with 22s safety timeout...');

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'French-B1-Master-App',
            },
            body: JSON.stringify(bodyContent),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
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
        console.error('DeepSeek Proxy Error:', error.name, error.message);

        const isTimeout = error.name === 'AbortError';

        return new Response(JSON.stringify({
            error: 'DeepSeek Proxy Failure',
            details: isTimeout ? 'DeepSeek took too long (>22s). Falling back and switching to Gemini.' : error.message
        }), {
            status: isTimeout ? 504 : 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
