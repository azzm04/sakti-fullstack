"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalShellProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: "sm" | "md";
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Wrapper modal generik (backdrop + card + header + tombol close).
 * Menggantikan markup backdrop/animasi yang sebelumnya diulang persis
 * sama di 3 tempat: modal tambah/edit pewawancara, modal buat sesi,
 * dan modal edit kuota.
 */
export default function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  maxWidth = "sm",
  children,
  footer,
}: ModalShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-2xl border border-slate-100 shadow-xl p-6 w-full mx-4 ${
              maxWidth === "md" ? "max-w-md" : "max-w-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800">{title}</h3>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100"
                title="Tutup"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">{children}</div>

            <div className="flex gap-2 mt-6">{footer}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
