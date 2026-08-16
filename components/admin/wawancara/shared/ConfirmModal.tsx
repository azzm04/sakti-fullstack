"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, Zap, Play } from "lucide-react";

export type ConfirmVariant = "warning" | "danger" | "info";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    btnClass: string;
    defaultLabel: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-admin-danger-border",
    iconColor: "text-admin-danger-text",
    btnClass: "bg-admin-danger-bar hover:bg-admin-danger-text",
    defaultLabel: "Hapus",
  },
  warning: {
    icon: Zap,
    iconBg: "bg-admin-warn-border",
    iconColor: "text-admin-warn-text",
    btnClass: "bg-admin-warn-bar hover:bg-admin-warn-text",
    defaultLabel: "Ya, Lanjutkan",
  },
  info: {
    icon: Play,
    iconBg: "bg-admin-accent/20",
    iconColor: "text-admin-accent",
    btnClass: "bg-admin-accent hover:bg-admin-accent/90",
    defaultLabel: "Lanjutkan",
  },
};

/**
 * Modal konfirmasi generik.
 * Sebelumnya ada 2 implementasi terpisah (deleteTarget modal di
 * DaftarPewawancara & confirmModal di SesiWAR) yang JSX-nya nyaris
 * identik — sekarang disatukan di sini dan tinggal dipanggil dengan
 * variant + title + description berbeda.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  variant = "warning",
  confirmLabel,
  cancelLabel = "Batal",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-admin-border-soft"
          >
            <div className="flex justify-center mb-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${cfg.iconBg}`}
              >
                <Icon size={24} className={cfg.iconColor} />
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="font-admin-heading text-lg font-bold text-admin-text mb-2">{title}</h3>
              <p className="text-sm text-admin-text-4 leading-relaxed">{description}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2.5 text-sm font-semibold border border-admin-border rounded-xl hover:bg-admin-surface-soft text-admin-text-2 transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${cfg.btnClass}`}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {confirmLabel ?? cfg.defaultLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
