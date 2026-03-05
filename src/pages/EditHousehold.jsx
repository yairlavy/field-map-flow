import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Save } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getHousehold, updateHousehold, getHouseholdByNumber } from '../components/db/householdOps';
import StatusBar from '../components/ui/StatusBar';

export default function EditHousehold() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const householdId = params.get('id');

  const [form, setForm] = useState({ houseNumber: '', area: '', address: '', gpsLat: '', gpsLng: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (householdId) {
      getHousehold(householdId).then(h => {
        if (h) setForm({ houseNumber: h.houseNumber, area: h.area || '', address: h.address || '', gpsLat: h.gpsLat || '', gpsLng: h.gpsLng || '', notes: h.notes || '' });
      });
    }
  }, [householdId]);

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); setError(''); }

  function captureGPS() {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set('gpsLat', pos.coords.latitude); set('gpsLng', pos.coords.longitude); setGpsLoading(false); },
      () => { setError('לא ניתן לקבל מיקום GPS'); setGpsLoading(false); }
    );
  }

  async function handleSave() {
    if (!form.houseNumber.trim()) { setError('מספר בית נדרש'); return; }
    setSaving(true);
    if (householdId) {
      const original = await getHousehold(householdId);
      if (original.houseNumber !== form.houseNumber.trim()) {
        const existing = await getHouseholdByNumber(form.houseNumber.trim());
        if (existing) { setError('מספר בית זה כבר קיים'); setSaving(false); return; }
      }
      await updateHousehold(householdId, {
        houseNumber: String(form.houseNumber.trim()),
        area: form.area, address: form.address,
        gpsLat: form.gpsLat || null, gpsLng: form.gpsLng || null, notes: form.notes,
      });
      navigate(createPageUrl(`HouseholdDetail?id=${householdId}`));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="bg-white dark:bg-slate-800 px-4 pb-5 shadow-sm page-header">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 select-none">
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">עריכת בית</h1>
          <StatusBar />
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">מספר בית *</label>
          <input type="text" value={form.houseNumber} onChange={e => set('houseNumber', e.target.value)} className="w-full px-4 py-3.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר בית" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">אזור / שכונה</label>
          <input type="text" value={form.area} onChange={e => set('area', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="שם האזור" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">כתובת</label>
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="כתובת מלאה" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">מיקום GPS</label>
          <div className="flex gap-3">
            <input type="text" value={form.gpsLat} readOnly className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-500 text-sm" placeholder="קו רוחב" />
            <input type="text" value={form.gpsLng} readOnly className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-500 text-sm" placeholder="קו אורך" />
            <button onClick={captureGPS} disabled={gpsLoading} className="px-4 py-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl font-medium text-sm active:scale-95 transition-transform flex items-center gap-1 select-none">
              <MapPin className="w-4 h-4" />
              {gpsLoading ? '...' : 'לכוד'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">הערות</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="הערות נוספות..." />
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

        <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 select-none">
          <Save className="w-5 h-5" />
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  );
}