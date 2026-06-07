import { getOrCreateUUID } from './uuid.js';

const BACKEND_URL = 'https://tokenlite-backend.vercel.app';

async function convertScreenshot(imageBase64, mimeType) {
  try {
    const uuid = await getOrCreateUUID();
    
    const response = await fetch(`${BACKEND_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        mime_type: mimeType,
        uuid: uuid
      })
    });

    if (response.status === 200) {
      const data = await response.json();
      return {
        markdown: data.markdown,
        screenshots_used: data.screenshots_used,
        screenshots_remaining: data.screenshots_remaining
      };
    } else if (response.status === 403) {
      return { 
        error: 'LIMIT_REACHED', 
        screenshots_used: 5, 
        screenshots_remaining: 0 
      };
    } else if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return { error: data.error || 'GEMINI_QUOTA_EXCEEDED' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { error: data.error || 'OCR_FAILED' };
    }
  } catch (error) {
    console.error('TokenLite backend screenshot request failed:', error);
    return { error: 'OFFLINE' };
  }
}

async function getScreenshotCount() {
  try {
    const uuid = await getOrCreateUUID();
    
    const response = await fetch(`${BACKEND_URL}/api/usage?uuid=${encodeURIComponent(uuid)}`);
    
    if (response.ok) {
      const data = await response.json();
      // Handle potential variations in the API response format
      if (typeof data.count === 'number') {
        return data.count;
      } else if (typeof data.screenshots_used === 'number') {
        return data.screenshots_used;
      }
      return data.count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('TokenLite backend usage request failed:', error);
    return 0;
  }
}

export { convertScreenshot, getScreenshotCount };
