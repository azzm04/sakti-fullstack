import { Send, Loader2, ImagePlus, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const ACCEPTED_EXT = ".png,.jpg,.jpeg,.webp,.gif";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string | null) => void;
  isLoading: boolean;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput]           = useState("");
  const [preview, setPreview]       = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imgError, setImgError]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!input.trim() && !imageBase64) || isLoading) return;
    onSend(input, imageBase64);
    setInput("");
    setPreview(null);
    setImageBase64(null);
    setImgError("");
  };

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImgError("Hanya gambar (PNG, JPG, WebP, GIF) yang diizinkan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgError("Ukuran gambar maksimal 5MB.");
      return;
    }
    setImgError("");
    const b64 = await toBase64(file);
    setImageBase64(b64);
    setPreview(URL.createObjectURL(file));
  }, []);

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImageBase64(null);
    setImgError("");
  };

  const canSend = (input.trim() || imageBase64) && !isLoading;

  return (
    <div className="p-3 bg-white border-t border-slate-100">

      {/* Image preview */}
      {preview && (
        <div className="relative w-fit mb-2 ml-1 group">
          <img src={preview} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm" />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shadow"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {imgError && <p className="text-[11px] text-red-500 px-1 mb-1.5">{imgError}</p>}

      {/* Input row */}
      <div className="bg-slate-50 rounded-2xl flex items-end px-3 py-1.5 border border-slate-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all gap-1">

        {/* Image attach button */}
        <input ref={fileRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isLoading}
          title="Lampirkan gambar"
          className={`p-1.5 rounded-full transition-colors shrink-0 mb-0.5 ${
            imageBase64 ? "text-primary" : "text-slate-400 hover:text-primary"
          } disabled:opacity-40`}
        >
          <ImagePlus size={16} />
        </button>

        {/* Text input */}
        <input
          type="text"
          placeholder="Tanya SAKABOT..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          className="bg-transparent border-none outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400 py-1.5 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-sm shrink-0 mb-0.5"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
          )}
        </button>
      </div>
    </div>
  );
}
