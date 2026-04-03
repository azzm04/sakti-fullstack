'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
const ACCEPTED_EXT = '.png,.jpg,.jpeg,.svg,.webp,.gif';
const QUICK = ['Syarat Ekonomi KIPK', 'Cek Status DTKS', 'Dokumen Pendukung', 'Batas Waktu Pendaftaran'];

export type ImageAttachment = { file: File; previewUrl: string; base64: string };

interface Props {
  inputMessage: string;
  setInputMessage: (v: string) => void;
  attachment: ImageAttachment | null;
  setAttachment: (v: ImageAttachment | null) => void;
  isLoading: boolean;
  onSend: (text?: string) => void;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatInputBar({
  inputMessage, setInputMessage,
  attachment, setAttachment,
  isLoading, onSend,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const [imageError, setImageError] = useState('');

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [inputMessage]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { setImageError('Format tidak didukung.'); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError('Ukuran gambar maksimal 5MB.'); return; }
    setImageError('');
    const base64 = await toBase64(file);
    setAttachment({ file, previewUrl: URL.createObjectURL(file), base64 });
    e.target.value = '';
  }, [setAttachment]);

  const removeAttachment = useCallback(() => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    setImageError('');
  }, [attachment, setAttachment]);

  const canSend = (inputMessage.trim() || attachment) && !isLoading;

  return (
    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#f7f9fb] via-[#f7f9fb]/95 to-transparent">
      <div className="max-w-4xl mx-auto">

        {/* Quick suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {QUICK.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-white border border-slate-200/60 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Image preview */}
        <AnimatePresence>
          {attachment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-1 mb-2"
            >
              <div className="relative group">
                <img src={attachment.previewUrl} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm" />
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow text-xs"
                >✕</button>
              </div>
              <div className="text-xs text-slate-500">
                <p className="font-medium text-slate-700 truncate max-w-[160px]">{attachment.file.name}</p>
                <p>{(attachment.file.size / 1024).toFixed(0)} KB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {imageError && <p className="text-xs text-red-500 px-1 mb-2">{imageError}</p>}

        {/* Input container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl" />
          <div className="relative flex items-end gap-3 p-2 bg-white rounded-[2rem] shadow-xl border border-slate-200/40 transition-all group-focus-within:border-primary/30">
            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={handleImageSelect} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-full transition-colors ${attachment ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
              title="Lampirkan gambar"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>

            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
              }}
              rows={1}
              placeholder="Tanyakan sesuatu ke SAKABOT..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none py-3 text-sm resize-none overflow-hidden max-h-32 font-body text-slate-700 placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={() => onSend()}
              disabled={!canSend}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-white shadow-lg active:scale-90 transition-transform disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-3 text-[10px] text-slate-400/70 font-medium">
          SAKABOT dapat memberikan informasi yang tidak akurat. Mohon verifikasi kembali melalui panduan resmi Puslapdik.
        </p>
      </div>
    </div>
  );
}
