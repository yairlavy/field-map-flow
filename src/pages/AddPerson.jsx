import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { createPerson, updatePerson, checkDuplicate } from '../components/db/peopleOps';
import { db, saveDraft, getDraft, clearDraft, getPhoto } from '../components/db/database';
import { getHousehold } from '../components/db/householdOps';
import PhotoCapture from '../components/census/PhotoCapture';
import ConfirmDialog from '../components/census/ConfirmDialog';
import StatusBar from '../components/ui/StatusBar';

const DRAFT_KEY = 'addPersonDraft';

const emptyForm = {
  nameMode: 'simple', // 'simple' | 'quadruple'
  fullName: '',
  firstNameAr: '',
  fatherNameAr: '',
  grandfatherNameAr: '',
  familyNameAr: '',
  age: '',
  gender: 'unknown',
  phone: '',
  idNumber: '',
  status: 'resident',
  specialNeeds: '',
  notes: '',
  photoBase64: null,
};

function buildFullNameAr(form) {
  return [form.firstNameAr, form.fatherNameAr, form.grandfatherNameAr, form.familyNameAr]
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ');
}

export default function AddPerson() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const householdId = params.get('householdId');
  const personId = params.get('personId');
  const isEdit = !!personId;

  const [form, setForm] = useState({ ...emptyForm });
  const [household, setHousehold] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [dupWarning, setDupWarning] = useState(false);

  const isQuadruple = form.nameMode === 'quadruple';
  const previewName = isQuadruple ? buildFullNameAr(form) : form.fullName;

  useEffect(() => {
    getHousehold(householdId).then(setHousehold);
    if (isEdit) {
      loadPersonForEdit();
    } else {
      getDraft(DRAFT_KEY).then(draft => {
        if (draft && draft.householdId === householdId) setShowDraftPrompt(true);
      });
    }
  }, [householdId, personId]);

  async function loadPersonForEdit() {
    const person = await db.people.get(personId);
    if (person) {
      const photo = await getPhoto(personId);
      const hasQuadruple = !!(person.firstNameAr || person.fatherNameAr || person.grandfatherNameAr || person.familyNameAr);
      setForm({
        nameMode: hasQuadruple ? 'quadruple' : 'simple',
        fullName: person.fullName || '',
        firstNameAr: person.firstNameAr || '',
        fatherNameAr: person.fatherNameAr || '',
        grandfatherNameAr: person.grandfatherNameAr || '',
        familyNameAr: person.familyNameAr || '',
        age: person.age || '',
        gender: person.gender || 'unknown',
        phone: person.phone || '',
        idNumber: person.idNumber || '',
        status: person.status || 'resident',
        specialNeeds: person.specialNeeds || '',
        notes: person.notes || '',
        photoBase64: photo || null,
      });
    }
  }

  function set(field, val) {
    setForm(prev => {
      const next = { ...prev, [field]: val };
      if (!isEdit) saveDraft(DRAFT_KEY, { ...next, householdId });
      return next;
    });
    setError('');
  }

  function toggleMode() {
    set('nameMode', isQuadruple ? 'simple' : 'quadruple');
  }

  function validate() {
    if (isQuadruple) {
      const parts = [form.firstNameAr.trim(), form.fatherNameAr.trim(), form.grandfatherNameAr.trim(), form.familyNameAr.trim()];
      if (parts.some(p => !p)) {
        setError('Please fill all 4 name parts (First / Father / Grandfather / Family).');
        return false;
      }
    } else {
      if (!form.fullName.trim()) { setError('שם מלא נדרש'); return false; }
    }
    if (!form.photoBase64) { setError('תמונה נדרשת'); return false; }
    return true;
  }

  async function handleSave(andAddAnother = false) {
    if (!validate()) return;

    const resolvedFullName = isQuadruple ? buildFullNameAr(form) : form.fullName.trim();

    const isDup = await checkDuplicate(householdId, resolvedFullName, personId);
    if (isDup && !dupWarning) { setDupWarning(true); return; }
    setDupWarning(false);

    setSaving(true);
    const data = {
      ...form,
      fullName: resolvedFullName,
      fullNameAr: isQuadruple ? resolvedFullName : '',
      firstNameAr: isQuadruple ? form.firstNameAr.trim() : '',
      fatherNameAr: isQuadruple ? form.fatherNameAr.trim() : '',
      grandfatherNameAr: isQuadruple ? form.grandfatherNameAr.trim() : '',
      familyNameAr: isQuadruple ? form.familyNameAr.trim() : '',
      householdId,
    };

    if (isEdit) {
      await updatePerson(personId, data);
    } else {
      await createPerson(data);
    }
    await clearDraft(DRAFT_KEY);
    setSaving(false);

    if (andAddAnother) {
      setForm({ ...emptyForm });
    } else {
      navigate(createPageUrl(`HouseholdDetail?id=${householdId}`));
    }
  }

  function handleBack() {
    const hasData = form.fullName || form.firstNameAr || form.photoBase64;
    if (hasData && !isEdit) setShowDiscardConfirm(true);
    else navigate(createPageUrl(`HouseholdDetail?id=${householdId}`));
  }

  function restoreDraft() {
    getDraft(DRAFT_KEY).then(d => {
      if (d) setForm({
        nameMode: d.nameMode || 'simple',
        fullName: d.fullName || '',
        firstNameAr: d.firstNameAr || '',
        fatherNameAr: d.fatherNameAr || '',
        grandfatherNameAr: d.grandfatherNameAr || '',
        familyNameAr: d.familyNameAr || '',
        age: d.age || '',
        gender: d.gender || 'unknown',
        phone: d.phone || '',
        idNumber: d.idNumber || '',
        status: d.status || 'resident',
        specialNeeds: d.specialNeeds || '',
        notes: d.notes || '',
        photoBase64: d.photoBase64 || null,
      });
    });
    setShowDraftPrompt(false);
  }

  const genderOptions = [{ v: 'unknown', l: 'לא ידוע' }, { v: 'male', l: 'זכר' }, { v: 'female', l: 'נקבה' }, { v: 'other', l: 'אחר' }];
  const statusOptions = [{ v: 'resident', l: 'תושב' }, { v: 'guest', l: 'אורח' }, { v: 'unknown', l: 'לא ידוע' }];

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-white px-4 pt-12 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="p-2 rounded-xl bg-slate-100">
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-slate-900">{isEdit ? 'עריכת תושב' : 'הוספת תושב'}</h1>
            {household && <p className="text-xs text-slate-400">בית {household.houseNumber}</p>}
          </div>
          <StatusBar />
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-32">
        {/* Photo */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-3">תמונה *</label>
          <PhotoCapture value={form.photoBase64} onChange={val => set('photoBase64', val)} />
        </div>

        {/* Name Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 text-sm">שם</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isQuadruple ? 'الاسم الرباعي — Arabic Quadruple Name' : 'שם רגיל / Regular Name'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                isQuadruple ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isQuadruple
                ? <ToggleRight className="w-4 h-4" />
                : <ToggleLeft className="w-4 h-4" />}
              {isQuadruple ? 'رباعي' : 'רגיל'}
            </button>
          </div>

          {/* Simple mode */}
          {!isQuadruple && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">שם מלא *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="שם מלא"
                autoFocus={!isEdit}
              />
            </div>
          )}

          {/* Quadruple mode */}
          {isQuadruple && (
            <div className="space-y-3" dir="rtl">
              {[
                { field: 'firstNameAr', label: 'שם פרטי — الاسم الأول', placeholder: 'أحمد' },
                { field: 'fatherNameAr', label: 'שם האב — اسم الأب', placeholder: 'محمد' },
                { field: 'grandfatherNameAr', label: 'שם הסב — اسم الجد', placeholder: 'علي' },
                { field: 'familyNameAr', label: 'שם משפחה — اسم العائلة / اللقب', placeholder: 'حسين' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">{label} *</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-base"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              {/* Live Preview */}
              {previewName && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mt-1">
                  <p className="text-xs text-amber-600 font-medium mb-1">المعاينة / Preview</p>
                  <p className="text-base font-bold text-amber-900" dir="rtl">{previewName}</p>
                </div>
              )}
            </div>
          )}

          {/* Other basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">גיל</label>
              <input type="number" inputMode="numeric" value={form.age} onChange={e => set('age', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="גיל" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">טלפון</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר טלפון" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">מין</label>
            <div className="flex gap-2 flex-wrap">
              {genderOptions.map(opt => (
                <button key={opt.v} type="button" onClick={() => set('gender', opt.v)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${form.gender === opt.v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">סטטוס</label>
            <div className="flex gap-2">
              {statusOptions.map(opt => (
                <button key={opt.v} type="button" onClick={() => set('status', opt.v)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${form.status === opt.v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">מספר ת.ז.</label>
            <input type="text" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר תעודת זהות" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">צרכים מיוחדים / הערות</label>
            <textarea value={form.specialNeeds} onChange={e => set('specialNeeds', e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="צרכים מיוחדים..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">הערות</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="הערות נוספות..." />
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">{error}</div>}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 flex gap-3">
        {!isEdit && (
          <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 py-3.5 bg-slate-700 text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            שמור + הוסף עוד
          </button>
        )}
        <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-95 transition-transform shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>

      {showDraftPrompt && (
        <ConfirmDialog title="שחזור טיוטה" message="נמצאה טיוטה שלא נשמרה. לשחזר?" confirmLabel="שחזר" cancelLabel="התחל חדש" danger={false}
          onConfirm={restoreDraft} onCancel={() => { clearDraft(DRAFT_KEY); setShowDraftPrompt(false); }} />
      )}
      {showDiscardConfirm && (
        <ConfirmDialog title="בטל הוספה" message="הנתונים שהזנת לא ישמרו. להמשיך?" confirmLabel="כן, בטל"
          onConfirm={() => navigate(createPageUrl(`HouseholdDetail?id=${householdId}`))}
          onCancel={() => setShowDiscardConfirm(false)} />
      )}
      {dupWarning && (
        <ConfirmDialog title="אזהרת כפיל" message={`כבר קיים תושב בשם "${previewName}" בבית זה. להמשיך בכל זאת?`} confirmLabel="המשך" cancelLabel="בטל" danger={false}
          onConfirm={() => { setDupWarning(false); handleSave(false); }}
          onCancel={() => setDupWarning(false)} />
      )}
    </div>
  );
}