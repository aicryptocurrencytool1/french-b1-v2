// Vercel Edge Function for DeepSeek Proxy
// Edge Runtime allows up to 30s execution time, solving the "terminated" (10s limit) issue.

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // Standard CORS headers for Edge
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
        console.error('DEEPSEEK_API_KEY is missing');
        return new Response(JSON.stringify({ error: 'DeepSeek API key not configured on Vercel' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        const bodyContent = await req.json();

        // Edge functions have a 25-30s timeout limit, much better than Serverless 10s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 seconds

        console.log('Forwarding request to DeepSeek (Edge Runtime)...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(bodyContent),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // We can return the body as a stream for maximum efficiency
        return new Response(response.body, {
            status: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Edge Proxy Exception:', error.name, error.message);

        const isTimeout = error.name === 'AbortError' || error.message.includes('terminated');

        return new Response(JSON.stringify({
            error: isTimeout ? 'DeepSeek Timeout' : 'Failed to communicate with DeepSeek',
            message: error.message
        }), {
            status: isTimeout ? 504 : 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
