"use client";

import { motion } from "framer-motion";
import { ValidationSummary } from "@/app/admin/import/page";

interface Props {
  stats: ValidationSummary;
}

export default function ValidationStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center border-l-4 border-primary"
      >
        <span className="text-[10px] font-bold text-outline uppercase">
          Valid
        </span>
        <span className="text-2xl font-extrabold text-primary">
          {stats.valid}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center border-l-4 border-error"
      >
        <span className="text-[10px] font-bold text-outline uppercase">
          Incomplete
        </span>
        <span className="text-2xl font-extrabold text-error">
          {stats.incomplete}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center border-l-4 border-tertiary"
      >
        <span className="text-[10px] font-bold text-outline uppercase">
          Duplicates
        </span>
        <span className="text-2xl font-extrabold text-tertiary">
          {stats.duplicates}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-primary p-4 rounded-xl flex flex-col items-center text-white"
      >
        <span className="text-[10px] font-bold opacity-70 uppercase">
          Total Data
        </span>
        <span className="text-2xl font-extrabold">{stats.total}</span>
      </motion.div>
    </div>
  );
}
