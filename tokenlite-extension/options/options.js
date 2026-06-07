import { getOrCreateUUID } from '../utils/uuid.js';

document.addEventListener('DOMContentLoaded', async () => {
  const uuidDisplay = document.getElementById('uuid-display');
  try {
    const uuid = await getOrCreateUUID();
    uuidDisplay.textContent = uuid;
  } catch (err) {
    uuidDisplay.textContent = 'Error loading ID';
  }
});
