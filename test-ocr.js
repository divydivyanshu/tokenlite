// Test OCR backend locally
async function testOCR() {
  try {
    console.log('Testing OCR endpoint...');
    
    // Create a simple 1x1 white pixel as base64
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await fetch('https://tokenlite-backend.vercel.app/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid: 'test-' + Date.now(),
        image_base64: base64Image,
        mime_type: 'image/png'
      })
    });
    
    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testOCR();