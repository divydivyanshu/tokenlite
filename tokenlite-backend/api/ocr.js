require('dotenv').config();
const { turso } = require('../lib/turso');

module.exports = async function (req, res) {
  // Allow CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        console.error('Invalid JSON body:', parseError);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { image_base64, mime_type = 'image/jpeg', uuid } = body;

    if (!uuid || !image_base64) {
      return res.status(400).json({ error: 'Missing required fields: uuid and image_base64' });
    }

    const usageResult = await turso.execute({
      sql: 'SELECT screenshot_count FROM usage WHERE uuid = ?',
      args: [uuid]
    });

    let currentCount = 0;
    if (usageResult.rows.length > 0) {
      currentCount = usageResult.rows[0].screenshot_count;
    }

    if (currentCount >= 5) {
      return res.status(403).json({
        error: 'LIMIT_REACHED',
        screenshots_used: 5,
        screenshots_remaining: 0
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview', // Vision model that supports images
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mime_type};base64,${image_base64}`
              }
            },
            {
              type: 'text',
              text: 'Extract all text from this image. Return clean markdown only. Preserve tables, headings, bullet lists. No explanation or preamble.'
            }
          ]
        }]
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API Error:', errText);
      
      // More specific error handling
      if (errText.includes('model does not support image input')) {
        return res.status(400).json({ 
          error: 'OCR_FAILED', 
          message: 'Vision model not available. Please try another image or contact support.' 
        });
      }
      
      if (errText.includes('quota') || errText.includes('rate limit')) {
        return res.status(429).json({ 
          error: 'GEMINI_QUOTA_EXCEEDED', 
          message: 'API quota exceeded. Please try again later.' 
        });
      }
      
      return res.status(502).json({ 
        error: 'OCR_FAILED', 
        message: 'Image processing failed. Please try again.' 
      });
    }

    const data = await groqRes.json();
    const markdown = data.choices?.[0]?.message?.content || '';

    await turso.execute({
      sql: `INSERT INTO usage (uuid, screenshot_count)
            VALUES (?, 1)
            ON CONFLICT(uuid)
            DO UPDATE SET screenshot_count = screenshot_count + 1`,
      args: [uuid]
    });

    const newCount = currentCount + 1;
    const remaining = Math.max(0, 5 - newCount);

    return res.status(200).json({
      markdown,
      screenshots_used: newCount,
      screenshots_remaining: remaining
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
