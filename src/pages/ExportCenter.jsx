import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, FileSpreadsheet, Archive, CheckCircle, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { exportCSV, exportXLSX, exportZIP } from '../components/db/exportOps';
import { db } from '../components/db/database';
import StatusBar from '../components/ui/StatusBar';

export default function ExportCenter() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ households: 0, people: 0 });
  const [exporting, setExporting] = useState(null); // 'csv' | 'xlsx' | 'zip'
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([db.households.count(), db.people.count()]).then(([h, p]) => setStats({ households: h, people: p }));
  }, []);

  async function runExport(type) {
    setExporting(type);
    setProgress(0);
    setResult(null);
    setError('');
    try {
      let filename;
      if (type === 'csv') {
        filename = await exportCSV();
        setResult({ filename, type: 'CSV' });
      } else if (type === 'xlsx') {
        filename = await exportXLSX();
        setResult({ filename, type: 'Excel (XLSX)' });
      } else if (type === 'zip') {
        const res = await exportZIP(setProgress);
        setResult({ filename: res.filename, type: 'ZIP Bundle', counts: res.counts });
      }
    } catch (e) {
      setError('שגיאה בייצוא: ' + e.message);
    }
    setExporting(null);
    setProgress(0);
  }

  const exportOptions = [
    {
      type: 'csv',
      icon: <Download className="w-6 h-6" />,
      title: 'ייצוא CSV',
      desc: 'נפתח ב-Excel, קובץ אחד עם כל האנשים',
      color: 'bg-emerald-500',
      light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      type: 'xlsx',
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: 'ייצוא Excel (XLSX)',
      desc: 'קובץ Excel עם 3 גליונות: אנשים, בתים, סיכום',
      color: 'bg-blue-500',
      light: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      type: 'zip',
      icon: <Archive className="w-6 h-6" />,
      title: 'חבילת ZIP מלאה',
      desc: 'Excel + CSV + כל התמונות + manifest.json',
      color: 'bg-purple-500',
      light: 'bg-purple-50 border-purple-200 text-purple-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="bg-white dark:bg-slate-800 px-4 pb-5 shadow-sm page-header">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 select-none">
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">מרכז ייצוא</h1>
          <StatusBar />
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{stats.households}</p>
            <p className="text-xs text-slate-500 mt-0.5">בתים</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{stats.people}</p>
            <p className="text-xs text-slate-500 mt-0.5">אנשים</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {exportOptions.map(opt => (
          <button
            key={opt.type}
            onClick={() => runExport(opt.type)}
            disabled={!!exporting}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-right active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${opt.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0`}>
                {exporting === opt.type ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : opt.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{opt.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
            </div>
            {exporting === opt.type && opt.type === 'zip' && progress > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{progress}%</p>
              </div>
            )}
          </button>
        ))}

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">ייצוא הצליח!</p>
                <p className="text-sm text-emerald-700 mt-1">קובץ: {result.filename}</p>
                {result.counts && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {result.counts.households} בתים · {result.counts.people} אנשים · {result.counts.photos} תמונות
                  </p>
                )}
                <p className="text-xs text-emerald-500 mt-1">הקובץ ירד לתיקיית ההורדות</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">שגיאה בייצוא</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
          <p className="font-semibold mb-1">הערה לשימוש אופליין</p>
          <p className="text-xs">הייצוא נוצר מהנתונים המקומיים בלבד ואינו דורש חיבור לאינטרנט. הקבצים ירדו ישירות למכשיר.</p>
        </div>
      </div>
    </div>
  );
}