// Simple status check for backend
async function checkBackend() {
  try {
    console.log('Checking backend status...');
    
    // Test 1: Simple GET to root
    const rootRes = await fetch('https://tokenlite-backend.vercel.app');
    console.log('Root status:', rootRes.status);
    
    // Test 2: Check environment
    const envRes = await fetch('https://tokenlite-backend.vercel.app/api/env-check');
    console.log('Env check status:', envRes.status);
    
    if (envRes.status !== 404) {
      const envText = await envRes.text();
      console.log('Env response:', envText.substring(0, 200));
    }
    
    // Test 3: OCR with better error capture
    const ocrRes = await fetch('https://tokenlite-backend.vercel.app/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuid: 'debug-' + Date.now(),
        image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        mime_type: 'image/png'
      })
    });
    
    console.log('OCR status:', ocrRes.status);
    const ocrText = await ocrRes.text();
    console.log('OCR response:', ocrText);
    
  } catch (error) {
    console.error('Backend check failed:', error.message);
  }
}

checkBackend();