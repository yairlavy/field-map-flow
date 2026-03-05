import React from 'react';
import { Home, Users, Clock, ChevronLeft } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

export default function HouseholdCard({ household, peopleCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-slate-900">בית {household.houseNumber}</span>
          {household.area && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{household.area}</span>
          )}
        </div>
        {household.address && (
          <p className="text-sm text-slate-500 truncate">{household.address}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{peopleCount} אנשים</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(household.updatedAt)}</span>
        </div>
      </div>
      <ChevronLeft className="w-5 h-5 text-slate-300 flex-shrink-0" />
    </button>
  );
}