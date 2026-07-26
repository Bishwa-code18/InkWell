// components/shared/ImageUpload.jsx — Cloudinary upload with drag-and-drop
import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 10;
const ACCEPTED    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUpload({ value, onChange, className = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, WebP, GIF supported');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange({ url: data.url, publicId: data.publicId });
      toast.success('Image uploaded');
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = async () => {
    if (value?.publicId) {
      try {
        await api.delete(`/upload/${encodeURIComponent(value.publicId)}`);
      } catch { /* non-critical */ }
    }
    onChange(null);
  };

  // ── Preview ──────────────────────────────────────────────────────────────
  if (value?.url) {
    return (
      <div className={`relative rounded-[8px] overflow-hidden border border-gray-200 ${className}`}>
        <img
          src={value.url}
          alt="Uploaded"
          className="w-full max-h-64 object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── Drop zone ────────────────────────────────────────────────────────────
  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-primary bg-primary-50 scale-[1.01]'
            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={handleFile}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {isDragging ? (
              <Upload size={28} className="text-primary" />
            ) : (
              <ImageIcon size={28} />
            )}
            <p className="text-sm font-medium text-gray-600">
              {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs">JPG, PNG, WebP, GIF · Max {MAX_SIZE_MB}MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
