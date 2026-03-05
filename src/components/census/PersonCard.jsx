import React, { useState, useEffect } from 'react';
import { User, Edit2, Trash2 } from 'lucide-react';
import { getPhoto } from '../db/database';

export default function PersonCard({ person, onEdit, onDelete }) {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    getPhoto(person.id).then(setPhoto);
  }, [person.id]);

  const genderLabel = { male: 'זכר', female: 'נקבה', other: 'אחר', unknown: '' };

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        {photo ? (
          <img src={photo} alt={person.fullName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <User className="w-7 h-7" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{person.fullName}</p>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          {person.age && <span>{person.age} שנים</span>}
          {person.gender && person.gender !== 'unknown' && <span>{genderLabel[person.gender]}</span>}
          {person.status === 'guest' && <span className="bg-amber-100 text-amber-700 px-1.5 rounded">אורח</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => onEdit(person)} className="p-2 rounded-xl bg-slate-50 text-blue-600 active:scale-95 transition-transform">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(person)} className="p-2 rounded-xl bg-slate-50 text-red-500 active:scale-95 transition-transform">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}