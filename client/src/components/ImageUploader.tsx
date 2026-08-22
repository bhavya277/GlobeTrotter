import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  defaultCover?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = '',
  onChange,
  label = 'Cover Image',
  defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = value || defaultCover;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        const res = await api.upload.uploadImage(base64Data);
        onChange(res.url);
      } catch (err: any) {
        console.error('Image upload failed:', err);
        setError(err.message || 'Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-300 uppercase">
          {label}
        </label>
      )}

      {/* Preview Card */}
      <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group">
        <img
          src={displayUrl}
          alt="Preview"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Replace Image
              </>
            )}
          </button>
          {value && value !== defaultCover && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 flex items-center gap-1.5 border border-rose-500/30"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : 'Upload Image (JPG, PNG, WebP)'}
        </button>

        <span className="text-[10px] text-slate-400">Max 5MB • Safe File Validation</span>
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-semibold pt-1">{error}</p>
      )}
    </div>
  );
};
