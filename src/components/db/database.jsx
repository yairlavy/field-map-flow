import Dexie from 'dexie';

export const db = new Dexie('FieldCensusDB');

db.version(1).stores({
  households: '++id, houseNumber, area, address, gpsLat, gpsLng, notes, createdAt, updatedAt',
  people: '++id, householdId, fullName, age, gender, phone, idNumber, status, specialNeeds, notes, photoFileName, createdAt, updatedAt',
  exportHistory: '++id, exportedAt, exportType, filePath, notes',
  appSettings: 'key',
  drafts: 'key',
  photosStore: 'id',
});

export async function initSettings() {
  const deviceId = await db.appSettings.get('deviceId');
  if (!deviceId) {
    const id = 'DEVICE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.appSettings.put({ key: 'deviceId', value: id });
  }
  const lang = await db.appSettings.get('language');
  if (!lang) await db.appSettings.put({ key: 'language', value: 'he' });
  const rtl = await db.appSettings.get('rtlEnabled');
  if (!rtl) await db.appSettings.put({ key: 'rtlEnabled', value: true });
  const quality = await db.appSettings.get('cameraQuality');
  if (!quality) await db.appSettings.put({ key: 'cameraQuality', value: 'medium' });
}

export async function getSetting(key) {
  const rec = await db.appSettings.get(key);
  return rec ? rec.value : null;
}

export async function setSetting(key, value) {
  await db.appSettings.put({ key, value });
}

export async function saveDraft(key, data) {
  await db.drafts.put({ key, data, savedAt: new Date().toISOString() });
}

export async function getDraft(key) {
  const rec = await db.drafts.get(key);
  return rec ? rec.data : null;
}

export async function clearDraft(key) {
  await db.drafts.delete(key);
}

export async function savePhoto(personId, base64Data) {
  await db.photosStore.put({ id: personId, data: base64Data });
}

export async function getPhoto(personId) {
  const rec = await db.photosStore.get(personId);
  return rec ? rec.data : null;
}

export async function deletePhoto(personId) {
  await db.photosStore.delete(personId);
}