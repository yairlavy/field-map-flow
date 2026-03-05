import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db, getPhoto } from './database';
import { getSetting } from './database';

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
}

function sanitizeFilename(name) {
  if (!name) return 'unknown';
  // For Hebrew names, use the name but replace problematic chars
  return name.replace(/[^a-zA-Z0-9א-ת\-_.]/g, '_').substring(0, 50);
}

export async function buildExportData() {
  const households = await db.households.toArray();
  const people = await db.people.toArray();
  const householdMap = {};
  households.forEach(h => { householdMap[h.id] = h; });

  const rows = people.map(p => {
    const h = householdMap[p.householdId] || {};
    return {
      houseNumber: h.houseNumber || '',
      area: h.area || '',
      address: h.address || '',
      gpsLat: h.gpsLat || '',
      gpsLng: h.gpsLng || '',
      personId: p.id,
      fullName: p.fullName,
      fullNameAr: p.fullNameAr || '',
      firstNameAr: p.firstNameAr || '',
      fatherNameAr: p.fatherNameAr || '',
      grandfatherNameAr: p.grandfatherNameAr || '',
      familyNameAr: p.familyNameAr || '',
      age: p.age || '',
      gender: p.gender || '',
      phone: p.phone || '',
      idNumber: p.idNumber || '',
      status: p.status || '',
      specialNeeds: p.specialNeeds || '',
      personNotes: p.notes || '',
      photoFileName: p.photoFileName || '',
      photoRelativePath: p.photoFileName ? `photos/house_${h.houseNumber}/${p.id}_${sanitizeFilename(p.fullName)}.jpg` : '',
      householdNotes: h.notes || '',
      createdAt: p.createdAt || '',
      updatedAt: p.updatedAt || '',
    };
  });

  return { households, people, rows };
}

export async function exportCSV() {
  const { rows } = await buildExportData();
  const headers = Object.keys(rows[0] || {
    houseNumber:'',area:'',address:'',gpsLat:'',gpsLng:'',personId:'',fullName:'',age:'',gender:'',phone:'',idNumber:'',status:'',specialNeeds:'',personNotes:'',photoFileName:'',photoRelativePath:'',householdNotes:'',createdAt:'',updatedAt:''
  });

  const csvLines = [
    '\uFEFF' + headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const filename = `population_export_${now()}.csv`;
  saveAs(blob, filename);
  return filename;
}

export async function exportXLSX() {
  const { households, rows } = await buildExportData();
  const deviceId = await getSetting('deviceId') || 'UNKNOWN';

  const wb = XLSX.utils.book_new();

  // People sheet
  const peopleWS = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, peopleWS, 'People');

  // Households sheet
  const hhRows = households.map(h => ({
    houseNumber: h.houseNumber,
    area: h.area || '',
    address: h.address || '',
    gpsLat: h.gpsLat || '',
    gpsLng: h.gpsLng || '',
    notes: h.notes || '',
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  }));
  const hhWS = XLSX.utils.json_to_sheet(hhRows);
  XLSX.utils.book_append_sheet(wb, hhWS, 'Households');

  // Summary sheet
  const summaryWS = XLSX.utils.json_to_sheet([{
    totalHouseholds: households.length,
    totalPeople: rows.length,
    exportDate: new Date().toISOString(),
    deviceId,
    appVersion: '1.0.0',
  }]);
  XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const filename = `population_export_${now()}.xlsx`;
  saveAs(blob, filename);
  return filename;
}

export async function exportZIP(onProgress) {
  const { households, people, rows } = await buildExportData();
  const deviceId = await getSetting('deviceId') || 'UNKNOWN';

  const zip = new JSZip();
  const exportFolder = zip.folder('export');
  const photosFolder = zip.folder('photos');

  // CSV
  const headers = Object.keys(rows[0] || {
    houseNumber:'',area:'',address:'',gpsLat:'',gpsLng:'',personId:'',fullName:'',age:'',gender:'',phone:'',idNumber:'',status:'',specialNeeds:'',personNotes:'',photoFileName:'',photoRelativePath:'',householdNotes:'',createdAt:'',updatedAt:''
  });
  const csvLines = [
    '\uFEFF' + headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
  ];
  exportFolder.file('population_export.csv', csvLines.join('\n'));

  // XLSX
  const wb = XLSX.utils.book_new();
  const peopleWS = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, peopleWS, 'People');
  const hhRows = households.map(h => ({
    houseNumber: h.houseNumber,
    area: h.area || '',
    address: h.address || '',
    gpsLat: h.gpsLat || '',
    gpsLng: h.gpsLng || '',
    notes: h.notes || '',
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hhRows), 'Households');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ totalHouseholds: households.length, totalPeople: people.length, exportDate: new Date().toISOString(), deviceId, appVersion: '1.0.0' }]), 'Summary');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  exportFolder.file('population_export.xlsx', wbout);

  // Photos
  const photoIndex = [];
  const householdMap = {};
  households.forEach(h => { householdMap[h.id] = h; });

  let count = 0;
  for (const p of people) {
    const h = householdMap[p.householdId] || {};
    const photoData = await getPhoto(p.id);
    if (photoData) {
      const base64 = photoData.split(',')[1] || photoData;
      const houseFolder = photosFolder.folder(`house_${h.houseNumber || 'unknown'}`);
      const fname = `${p.id}_${sanitizeFilename(p.fullName)}.jpg`;
      houseFolder.file(fname, base64, { base64: true });
      photoIndex.push({
        personId: p.id,
        houseNumber: h.houseNumber || '',
        fullName: p.fullName,
        photoPath: `photos/house_${h.houseNumber || 'unknown'}/${fname}`,
      });
    }
    count++;
    if (onProgress) onProgress(Math.round((count / people.length) * 80));
  }

  // manifest
  const manifest = {
    exportedAt: new Date().toISOString(),
    deviceId,
    appVersion: '1.0.0',
    counts: { households: households.length, people: people.length, photos: photoIndex.length },
    files: { xlsx: 'export/population_export.xlsx', csv: 'export/population_export.csv' },
    photoIndex,
  };
  exportFolder.file('manifest.json', JSON.stringify(manifest, null, 2));

  if (onProgress) onProgress(90);

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `population_bundle_${now()}.zip`;
  saveAs(blob, filename);

  if (onProgress) onProgress(100);
  return { filename, counts: manifest.counts };
}