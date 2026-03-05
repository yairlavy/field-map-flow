import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

export async function createHousehold(data, deviceId) {
  const existing = await db.households.where('houseNumber').equals(String(data.houseNumber)).first();
  if (existing) return { existing: true, household: existing };

  const now = new Date().toISOString();
  const id = uuidv4();
  await db.households.add({
    id,
    houseNumber: String(data.houseNumber),
    area: data.area || '',
    address: data.address || '',
    gpsLat: data.gpsLat || null,
    gpsLng: data.gpsLng || null,
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
    createdByDeviceId: deviceId || '',
  });
  return { existing: false, household: await db.households.get(id) };
}

export async function updateHousehold(id, data) {
  await db.households.update(id, { ...data, updatedAt: new Date().toISOString() });
  return db.households.get(id);
}

export async function deleteHousehold(id) {
  const people = await db.people.where('householdId').equals(id).toArray();
  const { deletePhoto } = await import('./database');
  for (const p of people) {
    await deletePhoto(p.id);
  }
  await db.people.where('householdId').equals(id).delete();
  await db.households.delete(id);
}

export async function getHousehold(id) {
  return db.households.get(id);
}

export async function getHouseholdByNumber(houseNumber) {
  return db.households.where('houseNumber').equals(String(houseNumber)).first();
}

export async function searchHouseholds(query) {
  if (!query) {
    return db.households.orderBy('updatedAt').reverse().toArray();
  }
  const q = String(query).toLowerCase();
  return db.households.filter(h =>
    h.houseNumber.toLowerCase().includes(q) ||
    (h.area && h.area.toLowerCase().includes(q)) ||
    (h.address && h.address.toLowerCase().includes(q))
  ).toArray();
}

export async function getRecentHouseholds(limit = 10) {
  return db.households.orderBy('updatedAt').reverse().limit(limit).toArray();
}

export async function countPeopleInHousehold(householdId) {
  return db.people.where('householdId').equals(householdId).count();
}