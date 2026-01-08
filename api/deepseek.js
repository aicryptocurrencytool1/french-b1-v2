// Vercel Edge Function for DeepSeek Proxy - Extreme Reliability Version
// Uses immediate streaming to bypass Vercel's 25s initial response timeout.

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
        console.error('CRITICAL: DEEPSEEK_API_KEY is not set in Vercel environment variables.');
        return new Response(JSON.stringify({ error: 'DeepSeek API key missing on server' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    // Diagnostic: Log first 4 chars of API key (mask the rest) to help user debug
    const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`DeepSeek Proxy: Using API Key [${maskedKey}]`);

    try {
        const bodyContent = await req.json();

        // DeepSeek-V3 is currently under heavy load. We use a long timeout.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 seconds (Edge limit is higher than Serverless)

        console.log('Sending request to DeepSeek (chat/completions)...');

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'Vercel Edge Function',
            },
            body: JSON.stringify(bodyContent),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`DeepSeek API returned error ${response.status}:`, errorData);
            return new Response(errorData, {
                status: response.status,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        // Return the raw response body stream to the client
        // This keeps the connection alive and avoids the 25s Vercel "initial response" timeout
        return new Response(response.body, {
            status: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('DeepSeek Proxy Exception:', error.name, error.message);

        let status = 500;
        let message = error.message;

        if (error.name === 'AbortError') {
            status = 504;
            message = 'DeepSeek API took too long to respond (55s+). Server is likely overloaded.';
        }

        return new Response(JSON.stringify({ error: 'DeepSeek Proxy Error', details: message }), {
            status,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
