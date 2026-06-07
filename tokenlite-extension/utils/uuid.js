async function getOrCreateUUID() {
  const result = await chrome.storage.local.get('tokenlite_uuid');
  
  if (result.tokenlite_uuid) {
    return result.tokenlite_uuid;
  }
  
  const newUuid = crypto.randomUUID();
  await chrome.storage.local.set({ tokenlite_uuid: newUuid });
  
  return newUuid;
}

export { getOrCreateUUID };
