import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getSetting, setSetting } from '../components/db/database';
import { db } from '../components/db/database';
import ConfirmDialog from '../components/census/ConfirmDialog';
import StatusBar from '../components/ui/StatusBar';

export default function Settings() {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState('');
  const [quality, setQuality] = useState('medium');
  const [dupWarn, setDupWarn] = useState(true);
  const [stats, setStats] = useState({ households: 0, people: 0 });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearStep2, setShowClearStep2] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      getSetting('deviceId'),
      getSetting('cameraQuality'),
      getSetting('dupWarnEnabled'),
      db.households.count(),
      db.people.count(),
    ]).then(([id, q, dup, h, p]) => {
      setDeviceId(id || '');
      setQuality(q || 'medium');
      setDupWarn(dup !== false);
      setStats({ households: h, people: p });
    });
  }, []);

  async function save() {
    await setSetting('cameraQuality', quality);
    await setSetting('dupWarnEnabled', dupWarn);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function clearAllData() {
    await db.households.clear();
    await db.people.clear();
    await db.photosStore.clear();
    await db.drafts.clear();
    setStats({ households: 0, people: 0 });
    setShowClearStep2(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="bg-white dark:bg-slate-800 px-4 pb-5 shadow-sm page-header">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 select-none">
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">הגדרות</h1>
          <StatusBar />
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Device Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-slate-500" />
            </div>
            <h2 className="font-semibold text-slate-900">מזהה מכשיר</h2>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 font-mono text-sm text-slate-600">{deviceId}</div>
          <p className="text-xs text-slate-400 mt-2">מזהה ייחודי למכשיר זה, נכלל בכל ייצוא</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-3">נתונים מקומיים</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-slate-900">{stats.households}</p>
              <p className="text-xs text-slate-500">בתים</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-slate-900">{stats.people}</p>
              <p className="text-xs text-slate-500">אנשים</p>
            </div>
          </div>
        </div>

        {/* Camera Quality */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-3">איכות מצלמה</h2>
          <div className="flex gap-2">
            {[{ v: 'low', l: 'נמוך' }, { v: 'medium', l: 'בינוני' }, { v: 'high', l: 'גבוה' }].map(opt => (
              <button key={opt.v} onClick={() => setQuality(opt.v)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${quality === opt.v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {opt.l}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">איכות נמוכה יותר = פחות שטח אחסון</p>
        </div>

        {/* Duplicate Warning */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">אזהרת כפיל</h2>
              <p className="text-xs text-slate-400 mt-0.5">התרה על שם זהה באותו בית</p>
            </div>
            <button onClick={() => setDupWarn(!dupWarn)} className={`w-12 h-6 rounded-full transition-colors ${dupWarn ? 'bg-blue-600' : 'bg-slate-300'} relative`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${dupWarn ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-2">אפליקציה</h2>
          <div className="space-y-1 text-sm text-slate-500">
            <p>גרסה: 1.0.0</p>
            <p>שפה: עברית (RTL)</p>
            <p>אחסון: מקומי בלבד (Offline-First)</p>
          </div>
        </div>

        {/* Save Button */}
        <button onClick={save} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
          {saved ? '✓ נשמר!' : 'שמור הגדרות'}
        </button>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-red-900">אזור מסוכן</h2>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            מחק את כל הנתונים
          </button>
          <p className="text-xs text-red-500 mt-2 text-center">פעולה זו בלתי הפיכה! ייצא נתונים לפני מחיקה.</p>
        </div>
      </div>

      {showClearConfirm && !showClearStep2 && (
        <ConfirmDialog
          title="מחק את כל הנתונים"
          message={`האם למחוק את כל ${stats.households} הבתים ו-${stats.people} האנשים? לא ניתן לשחזר.`}
          confirmLabel="כן, מחק הכל"
          onConfirm={() => { setShowClearConfirm(false); setShowClearStep2(true); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {showClearStep2 && (
        <ConfirmDialog
          title="אישור סופי"
          message="כל הנתונים ימחקו לצמיתות. אין דרך חזרה. אתה בטוח?"
          confirmLabel="מחק לצמיתות"
          onConfirm={clearAllData}
          onCancel={() => setShowClearStep2(false)}
        />
      )}
    </div>
  );
}