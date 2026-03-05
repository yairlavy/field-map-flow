import { db, savePhoto, deletePhoto } from './database';
import { v4 as uuidv4 } from 'uuid';

export async function createPerson(data) {
  const now = new Date().toISOString();
  const id = uuidv4();
  const photoFileName = data.photoBase64 ? `${id}.jpg` : '';

  const person = {
    id,
    householdId: data.householdId,
    fullName: data.fullName,
    fullNameAr: data.fullNameAr || '',
    firstNameAr: data.firstNameAr || '',
    fatherNameAr: data.fatherNameAr || '',
    grandfatherNameAr: data.grandfatherNameAr || '',
    familyNameAr: data.familyNameAr || '',
    age: data.age || null,
    gender: data.gender || 'unknown',
    phone: data.phone || '',
    idNumber: data.idNumber || '',
    status: data.status || 'resident',
    specialNeeds: data.specialNeeds || '',
    notes: data.notes || '',
    photoFileName,
    createdAt: now,
    updatedAt: now,
  };

  await db.people.add(person);

  if (data.photoBase64) {
    await savePhoto(id, data.photoBase64);
  }

  // touch household updatedAt
  await db.households.update(data.householdId, { updatedAt: now });

  return db.people.get(id);
}

export async function updatePerson(id, data) {
  const now = new Date().toISOString();
  const updates = { ...data, updatedAt: now };
  delete updates.photoBase64;

  if (data.photoBase64) {
    updates.photoFileName = `${id}.jpg`;
    await savePhoto(id, data.photoBase64);
  }

  await db.people.update(id, updates);

  const person = await db.people.get(id);
  if (person) {
    await db.households.update(person.householdId, { updatedAt: now });
  }

  return db.people.get(id);
}

export async function deletePerson(id) {
  const person = await db.people.get(id);
  if (!person) return;
  await deletePhoto(id);
  await db.people.delete(id);
  await db.households.update(person.householdId, { updatedAt: new Date().toISOString() });
}

export async function getPeopleByHousehold(householdId) {
  return db.people.where('householdId').equals(householdId).toArray();
}

export async function getAllPeople() {
  return db.people.toArray();
}

export async function checkDuplicate(householdId, fullName, excludeId) {
  const people = await db.people.where('householdId').equals(householdId).toArray();
  return people.some(p => p.fullName === fullName && p.id !== excludeId);
}