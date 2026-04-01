"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, ChevronDown } from "lucide-react";
import { CRITERIA } from "./data";

export default function BobotCard() {
  const [showBobot, setShowBobot] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col"
    >
      <motion.div
        whileHover={{ backgroundColor: "hsl(210 40% 98%)" }}
        className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between cursor-pointer select-none"
        onClick={() => setShowBobot((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Info size={17} className="text-primary" />
          <h2 className="font-headline font-bold text-foreground text-base">Bobot Kriteria</h2>
        </div>
        <motion.div animate={{ rotate: showBobot ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </motion.div>

      <div className="px-6 py-4 flex flex-wrap gap-2">
        {CRITERIA.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg"
          >
            <span className="text-xs font-semibold text-primary">{c.bobot}%</span>
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showBobot && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.3 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-3">
              {CRITERIA.map((c, i) => (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{c.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        c.type === "benefit" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {c.type}
                      </span>
                      <span className="text-xs font-bold text-primary">{c.bobot}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.bobot}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                    />
                  </div>
                </motion.div>
              ))}
              <p className="text-[11px] text-muted-foreground pt-1">
                Bobot default berdasarkan studi literatur. Konfigurasi manual tersedia di versi lanjutan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
