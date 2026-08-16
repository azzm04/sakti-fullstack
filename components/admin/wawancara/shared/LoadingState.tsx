import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 gap-2 text-admin-text-5">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}
