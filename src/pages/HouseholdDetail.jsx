import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Edit2, Trash2, Users, Clock, MapPin } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getHousehold, deleteHousehold } from '../components/db/householdOps';
import { getPeopleByHousehold, deletePerson } from '../components/db/peopleOps';
import PersonCard from '../components/census/PersonCard';
import ConfirmDialog from '../components/census/ConfirmDialog';
import StatusBar from '../components/ui/StatusBar';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

export default function HouseholdDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const householdId = params.get('id');

  const [household, setHousehold] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => { load(); }, [householdId]);

  async function load() {
    setLoading(true);
    const [h, p] = await Promise.all([getHousehold(householdId), getPeopleByHousehold(householdId)]);
    setHousehold(h);
    setPeople(p);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center" dir="rtl"><div className="text-slate-400">טוען...</div></div>;
  if (!household) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center" dir="rtl"><div className="text-slate-400">לא נמצא</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="bg-white dark:bg-slate-800 px-4 pb-5 shadow-sm page-header">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 select-none">
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <StatusBar />
          <div className="flex gap-2">
            <button onClick={() => navigate(createPageUrl(`EditHousehold?id=${householdId}`))} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-blue-600 select-none">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => { setConfirmDelete('household'); setDeleteStep(1); }} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 select-none">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">בית {household.houseNumber}</h1>
          {household.area && <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">{household.area}</p>}
          {household.address && <p className="text-sm text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{household.address}</p>}
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{people.length}</span>
            <span>אנשים</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(household.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">תושבים</h2>
          <button
            onClick={() => navigate(createPageUrl(`AddPerson?householdId=${householdId}`))}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-md shadow-blue-200 select-none"
          >
            <Plus className="w-4 h-4" />
            הוסף אדם
          </button>
        </div>

        {people.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">אין תושבים עדיין</p>
            <p className="text-xs mt-1">לחץ "הוסף אדם" כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {people.map(p => (
              <PersonCard
                key={p.id}
                person={p}
                onEdit={person => navigate(createPageUrl(`AddPerson?householdId=${householdId}&personId=${person.id}`))}
                onDelete={person => { setConfirmDelete(person); setDeleteStep(1); }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-4 right-4" style={{ maxWidth: 'calc(448px - 2rem)', margin: '0 auto', left: 0, right: 0 }}>
        <button
          onClick={() => navigate(createPageUrl(`AddPerson?householdId=${householdId}`))}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-blue-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none"
        >
          <Plus className="w-5 h-5" />
          הוסף אדם לבית {household.houseNumber}
        </button>
      </div>

      <div className="h-24" />

      {confirmDelete && confirmDelete !== 'household' && (
        <ConfirmDialog
          title="מחק תושב"
          message={`האם למחוק את ${confirmDelete.fullName}? לא ניתן לשחזר.`}
          confirmLabel="מחק"
          onConfirm={async () => { await deletePerson(confirmDelete.id); setPeople(prev => prev.filter(p => p.id !== confirmDelete.id)); setConfirmDelete(null); setDeleteStep(0); }}
          onCancel={() => { setConfirmDelete(null); setDeleteStep(0); }}
        />
      )}
      {confirmDelete === 'household' && deleteStep === 1 && (
        <ConfirmDialog
          title="מחק בית"
          message={`האם למחוק את בית ${household.houseNumber}? כל ${people.length} התושבים ימחקו.`}
          confirmLabel="כן, מחק"
          onConfirm={() => setDeleteStep(2)}
          onCancel={() => { setConfirmDelete(null); setDeleteStep(0); }}
        />
      )}
      {confirmDelete === 'household' && deleteStep === 2 && (
        <ConfirmDialog
          title="אישור סופי"
          message={`פעולה זו בלתי הפיכה. למחוק לצמיתות את בית ${household.houseNumber} ו-${people.length} תושביו?`}
          confirmLabel="מחק לצמיתות"
          onConfirm={async () => { await deleteHousehold(householdId); navigate(createPageUrl('Home')); }}
          onCancel={() => { setConfirmDelete(null); setDeleteStep(0); }}
        />
      )}
    </div>
  );
}