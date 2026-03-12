// src/components/db/exportOps.jsx
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db, getPhoto } from './database';
import { getSetting } from './database';

// Capacitor native file save + share (works in APK)
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
}

function sanitizeFilename(name) {
  if (!name) return 'unknown';
  // For Hebrew names, use the name but replace problematic chars
  return name.replace(/[^a-zA-Z0-9א-ת\-_.]/g, '_').substring(0, 50);
}

// ==============================
// Helpers: web download vs native (Capacitor) save+share
// ==============================
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(String(r.result).split(',')[1]); // remove data:*/*;base64,
    r.readAsDataURL(blob);
  });
}

async function saveBlobCrossPlatform(blob, filename, _mime) {
  const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();

  // Web: normal browser download
  if (!isNative) {
    saveAs(blob, filename);
    return;
  }

  // Native (Android/iOS): write file + share dialog
  const base64 = await blobToBase64(blob);

  const res = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  await Share.share({
    title: 'Export',
    text: filename,
    url: res.uri,
    dialogTitle: 'Save / Share export file',
  });
}

// ==============================
// Excel hyperlink helpers
// NOTE: We now place XLSX/CSV/manifest at ZIP ROOT (not under /export),
// so links like "photos/..." work without "../" hacks.
// ==============================
function computePhotoRelativePath(houseNumber, personId, fullName) {
  return `photos/house_${houseNumber || 'unknown'}/${personId}_${sanitizeFilename(fullName)}.jpg`;
}

// Turns values that look like "=HYPERLINK(...)" into real formula cells
function convertHyperlinkFormulaColumn(ws, colHeaderName) {
  if (!ws || !ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);
  const headerRow = range.s.r;

  // Map header -> column index
  const headerMap = {};
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: C });
    const cell = ws[cellAddr];
    if (cell && cell.v != null) headerMap[String(cell.v)] = C;
  }

  const linkCol = headerMap[colHeaderName];
  if (linkCol === undefined) return;

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: linkCol });
    const cell = ws[addr];
    const v = cell?.v;

    if (typeof v === 'string' && v.startsWith('=HYPERLINK(')) {
      // Store as formula (without '=')
      ws[addr] = { t: 'f', f: v.slice(1) };
    }
  }
}

export async function buildExportData() {
  const households = await db.households.toArray();
  const people = await db.people.toArray();
  const householdMap = {};
  households.forEach(h => { householdMap[h.id] = h; });

  const rows = people.map(p => {
    const h = householdMap[p.householdId] || {};
    const photoRelativePath = p.photoFileName
      ? computePhotoRelativePath(h.houseNumber, p.id, p.fullName)
      : '';

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
      photoRelativePath,
      // Excel-friendly hyperlink formula + raw path
      photoLinkPath: photoRelativePath,
      photoLink: photoRelativePath ? `=HYPERLINK("${photoRelativePath}", "Open photo")` : '',
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
    houseNumber:'',area:'',address:'',gpsLat:'',gpsLng:'',personId:'',fullName:'',age:'',gender:'',phone:'',idNumber:'',status:'',specialNeeds:'',personNotes:'',photoFileName:'',photoRelativePath:'',photoLinkPath:'',photoLink:'',householdNotes:'',createdAt:'',updatedAt:''
  });

  const csvLines = [
    '\uFEFF' + headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const filename = `population_export_${now()}.csv`;

  await saveBlobCrossPlatform(blob, filename, 'text/csv');
  return filename;
}

export async function exportXLSX() {
  const { households, rows } = await buildExportData();
  const deviceId = await getSetting('deviceId') || 'UNKNOWN';

  const wb = XLSX.utils.book_new();

  // People sheet (keep formulas)
  const peopleWS = XLSX.utils.json_to_sheet(rows, { cellFormula: true });
  convertHyperlinkFormulaColumn(peopleWS, 'photoLink');
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
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const filename = `population_export_${now()}.xlsx`;
  await saveBlobCrossPlatform(
    blob,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  return filename;
}

export async function exportZIP(onProgress) {
  const { households, people, rows } = await buildExportData();
  const deviceId = await getSetting('deviceId') || 'UNKNOWN';

  const zip = new JSZip();
  const photosFolder = zip.folder('photos');

  // ----------------------------
  // CSV (ROOT)
  // ----------------------------
  const headers = Object.keys(rows[0] || {
    houseNumber:'',area:'',address:'',gpsLat:'',gpsLng:'',personId:'',fullName:'',age:'',gender:'',phone:'',idNumber:'',status:'',specialNeeds:'',personNotes:'',photoFileName:'',photoRelativePath:'',photoLinkPath:'',photoLink:'',householdNotes:'',createdAt:'',updatedAt:''
  });
  const csvLines = [
    '\uFEFF' + headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
  ];
  zip.file('population_export.csv', csvLines.join('\n'));

  // ----------------------------
  // XLSX (ROOT, with hyperlink formulas)
  // ----------------------------
  const wb = XLSX.utils.book_new();
  const peopleWS = XLSX.utils.json_to_sheet(rows, { cellFormula: true });
  convertHyperlinkFormulaColumn(peopleWS, 'photoLink');
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

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([{
      totalHouseholds: households.length,
      totalPeople: people.length,
      exportDate: new Date().toISOString(),
      deviceId,
      appVersion: '1.0.0'
    }]),
    'Summary'
  );

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file('population_export.xlsx', wbout);

  // ----------------------------
  // Photos
  // ----------------------------
  const photoIndex = [];
  const householdMap = {};
  households.forEach(h => { householdMap[h.id] = h; });

  let count = 0;
  for (const p of people) {
    const h = householdMap[p.householdId] || {};
    const photoData = await getPhoto(p.id);
    if (photoData) {
      const base64 = photoData.split(',')[1] || photoData;

      const houseNumber = h.houseNumber || 'unknown';
      const houseFolder = photosFolder.folder(`house_${houseNumber}`);
      const fname = `${p.id}_${sanitizeFilename(p.fullName)}.jpg`;

      houseFolder.file(fname, base64, { base64: true });

      photoIndex.push({
        personId: p.id,
        houseNumber: h.houseNumber || '',
        fullName: p.fullName,
        photoPath: `photos/house_${houseNumber}/${fname}`,
      });
    }
    count++;
    if (onProgress) onProgress(Math.round((count / people.length) * 80));
  }

  // ----------------------------
  // manifest (ROOT)
  // ----------------------------
  const manifest = {
    exportedAt: new Date().toISOString(),
    deviceId,
    appVersion: '1.0.0',
    counts: { households: households.length, people: people.length, photos: photoIndex.length },
    files: { xlsx: 'population_export.xlsx', csv: 'population_export.csv' },
    photoIndex,
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  if (onProgress) onProgress(90);

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `population_bundle_${now()}.zip`;

  await saveBlobCrossPlatform(blob, filename, 'application/zip');

  if (onProgress) onProgress(100);
  return { filename, counts: manifest.counts };
}