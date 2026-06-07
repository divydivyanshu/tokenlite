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

    // Try multiple vision models in order
    const visionModels = [
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
    ];
    
    let lastError = null;
    
    for (const model of visionModels) {
      try {
        console.log(`Trying model: ${model}`);
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
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
            }],
            max_tokens: 2000
          })
        });

        if (!groqRes.ok) {
          const errText = await groqRes.text();
          console.error(`Model ${model} failed:`, errText);
          lastError = errText;
          
          // Check if model doesn't support images (multiple patterns)
          const imageSupportErrorPatterns = [
            'model does not support image input',
            'does not support images',
            'cannot read image',
            'unsupported image',
            'image not supported'
          ];
          
          const isImageSupportError = imageSupportErrorPatterns.some(pattern => 
            errText.toLowerCase().includes(pattern.toLowerCase())
          );
          
          if (isImageSupportError) {
            console.log(`Model ${model} doesn't support images, trying next...`);
            continue;
          }
          
          // Other errors break the loop
          console.log(`Model ${model} failed with other error, stopping retry loop`);
          break;
        }

        const data = await groqRes.json();
        const markdown = data.choices?.[0]?.message?.content || '';
        
        // Update usage in database
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
        
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        lastError = modelError.message;
        continue;
      }
    }

    // If we get here, all models failed
    console.error('All vision models failed. Last error:', lastError);
    
    // Check for various error types
    if (lastError) {
      const errorLower = lastError.toLowerCase();
      
      if (errorLower.includes('model does not support image input') || 
          errorLower.includes('does not support images') ||
          errorLower.includes('cannot read image') ||
          errorLower.includes('unsupported image') ||
          errorLower.includes('image not supported')) {
        return res.status(400).json({ 
          error: 'OCR_FAILED', 
          message: 'Vision models not available. Please try another image.' 
        });
      }
      
      if (errorLower.includes('quota') || errorLower.includes('rate limit')) {
        return res.status(429).json({ 
          error: 'GEMINI_QUOTA_EXCEEDED', 
          message: 'API quota exceeded. Please try again later.' 
        });
      }
      
      if (errorLower.includes('invalid api key') || errorLower.includes('authentication')) {
        return res.status(500).json({ 
          error: 'OCR_FAILED', 
          message: 'Service configuration error. Please contact support.' 
        });
      }
    }
    
    // Generic failure
    return res.status(502).json({ 
      error: 'OCR_FAILED', 
      message: 'Image processing failed. Please try again.' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
