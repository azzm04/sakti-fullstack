"use client"

import { Cpu } from "lucide-react"
import type { ModelInfo } from "@/types/analitik"

interface Props {
  data: ModelInfo
}

export default function ModelInfoCard({ data }: Props) {
  const params = Object.entries(data.best_params).map(([k, v]) => ({
    key: k.replace(/_/g, " "),
    value: v,
  }))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Cpu size={15} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Model Info
          </h3>
          <p className="text-[11px] text-slate-400">{data.algoritma}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Data Train</span>
          <span className="font-semibold text-slate-700">{data.jumlah_data_train}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Data Test</span>
          <span className="font-semibold text-slate-700">{data.jumlah_data_test}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Akurasi Train</span>
          <span className="font-semibold text-slate-700">{(data.train_accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Akurasi CV</span>
          <span className="font-semibold text-slate-700">{(data.cv_accuracy * 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Akurasi Test</span>
          <span className="font-bold text-indigo-600">{(data.test_accuracy * 100).toFixed(1)}%</span>
        </div>
      </div>

      {params.length > 0 && (
        <>
          <div className="my-4 h-px bg-slate-100" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Best Params
          </p>
          <div className="space-y-1.5">
            {params.map(({ key, value }) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-slate-500 capitalize">{key}</span>
                <span className="font-mono font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
