// api/env-check.js - Debug environment
module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check environment variables (masked)
    const envInfo = {
      groq_key_set: !!process.env.GROQ_API_KEY,
      groq_key_length: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
      groq_key_prefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '...' : null,
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV
    };
    
    // Test Groq API with simple text request
    if (process.env.GROQ_API_KEY) {
      try {
        const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10
          })
        });
        
        envInfo.groq_test_status = testRes.status;
        envInfo.groq_test_ok = testRes.ok;
        
        if (!testRes.ok) {
          const errorText = await testRes.text();
          envInfo.groq_error = errorText.substring(0, 200);
        }
      } catch (apiError) {
        envInfo.groq_test_error = apiError.message;
      }
    }
    
    return res.status(200).json(envInfo);
    
  } catch (error) {
    console.error('Env check error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
};