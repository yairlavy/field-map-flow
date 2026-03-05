import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'אישור', cancelLabel = 'ביטול', onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-medium text-sm active:scale-95 transition-transform">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-2xl font-medium text-sm text-white active:scale-95 transition-transform ${danger ? 'bg-red-600' : 'bg-amber-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}