import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Home as HomeIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { initSettings } from '../components/db/database';
import { searchHouseholds, getRecentHouseholds, getHouseholdByNumber, createHousehold, countPeopleInHousehold } from '../components/db/householdOps';
import { getSetting } from '../components/db/database';
import HouseholdCard from '../components/census/HouseholdCard';
import StatusBar from '../components/ui/StatusBar';

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [households, setHouseholds] = useState([]);
  const [peopleCounts, setPeopleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    initSettings().then(() => {
      getSetting('deviceId').then(id => setDeviceId(id || ''));
      loadHouseholds('');
    });
  }, []);

  const loadHouseholds = useCallback(async (q) => {
    setLoading(true);
    const list = q.trim() ? await searchHouseholds(q.trim()) : await getRecentHouseholds(20);
    setHouseholds(list);
    const counts = {};
    await Promise.all(list.map(async h => { counts[h.id] = await countPeopleInHousehold(h.id); }));
    setPeopleCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadHouseholds(query), 200);
    return () => clearTimeout(timer);
  }, [query, loadHouseholds]);

  async function handleOpenOrCreate() {
    const q = query.trim();
    if (!q) return;
    const existing = await getHouseholdByNumber(q);
    if (existing) { navigate(createPageUrl(`HouseholdDetail?id=${existing.id}`)); return; }
    setCreating(true);
    const { household } = await createHousehold({ houseNumber: q }, deviceId);
    setCreating(false);
    navigate(createPageUrl(`HouseholdDetail?id=${household.id}`));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pb-6 shadow-sm page-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">מיפוי אוכלוסייה</h1>
              <p className="text-xs text-slate-400">Field Census App</p>
            </div>
          </div>
          <StatusBar />
        </div>

        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="number"
            inputMode="numeric"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpenOrCreate()}
            placeholder="הכנס מספר בית..."
            className="w-full pr-11 pl-4 py-4 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl text-xl font-bold text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
          />
        </div>

        {query.trim() && (
          <button
            onClick={handleOpenOrCreate}
            disabled={creating}
            className="w-full mt-3 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 select-none"
          >
            <Plus className="w-5 h-5" />
            {creating ? 'יוצר...' : `פתח / צור בית ${query}`}
          </button>
        )}
      </div>

      {/* List */}
      <div className="px-4 py-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          {query.trim() ? 'תוצאות חיפוש' : 'בתים אחרונים'}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 h-20 animate-pulse" />)}
          </div>
        ) : households.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <HomeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{query ? 'לא נמצאו תוצאות' : 'אין בתים עדיין'}</p>
            <p className="text-xs mt-1">הכנס מספר בית למעלה כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {households.map(h => (
              <HouseholdCard
                key={h.id}
                household={h}
                peopleCount={peopleCounts[h.id] || 0}
                onClick={() => navigate(createPageUrl(`HouseholdDetail?id=${h.id}`))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}