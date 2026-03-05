import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Image } from 'lucide-react';

export default function PhotoCapture({ value, onChange }) {
  const fileRef = useRef();
  const cameraRef = useRef();
  const [preview, setPreview] = useState(value || null);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      compressImage(e.target.result, (compressed) => {
        setPreview(compressed);
        onChange(compressed);
      });
    };
    reader.readAsDataURL(file);
  }

  function compressImage(base64, callback) {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = (h * maxDim) / w; w = maxDim; }
      else if (h > maxDim) { w = (w * maxDim) / h; h = maxDim; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = base64;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img src={preview} alt="תצלום" className="w-full h-56 object-cover rounded-2xl shadow-lg border-2 border-white" />
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow-md text-red-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs h-48 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-10 h-10" />
            <span className="text-sm">אין תמונה</span>
          </div>
        </div>
      )}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => cameraRef.current.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform"
        >
          <Camera className="w-4 h-4" />
          צלם
        </button>
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform"
        >
          <Image className="w-4 h-4" />
          גלריה
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}