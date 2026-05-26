"use client";

import { useState, useEffect, useCallback } from "react";
import type { MahasiswaListItem, MahasiswaApiResponse } from "@/schemas";
import {
  JatahProgressBar,
  SesiFilter,
  ModeFilterTabs,
  SearchInput,
  LockedAlert,
  MahasiswaTable,
} from "@/components/pewawancara/mahasiswa";
import type { Mode } from "@/components/pewawancara/mahasiswa";

export default function PewawancaraMahasiswaPage() {
  const [mode, setMode] = useState<Mode>("saya");
  const [data, setData] = useState<MahasiswaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [jatahSelesai, setJatahSelesai] = useState(0);
  const [jatahTotal, setJatahTotal] = useState(0);
  const [jatahSudahSelesai, setJatahSudahSelesai] = useState(false);
  const [locked, setLocked] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [sesiList, setSesiList] = useState<{ id: number; tanggal: string }[]>([]);
  const [selectedSesiId, setSelectedSesiId] = useState<number | null>(null);

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLocked(false);
    try {
      const params = new URLSearchParams({ mode, search, page: String(page) });
      if (selectedSesiId) params.set("sesi_id", String(selectedSesiId));
      const res = await fetch(`/api/pewawancara/mahasiswa?${params}`);
      const json: MahasiswaApiResponse = await res.json();

      if (res.status === 403 && json.locked) {
        setLocked(true);
        setData([]);
        setTotal(0);
        setJatahSelesai(json.jatah_selesai ?? 0);
        setJatahTotal(json.jatah_total ?? 0);
        return;
      }

      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
      setJatahSelesai(json.jatah_selesai ?? 0);
      setJatahTotal(json.jatah_total ?? 0);
      setJatahSudahSelesai(json.jatah_sudah_selesai ?? false);
      setCanEdit((json as any).can_edit ?? true);
      if ((json as any).sesi_list) setSesiList((json as any).sesi_list);
    } finally {
      setLoading(false);
    }
  }, [mode, search, page, selectedSesiId]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  useEffect(() => { setPage(1); }, [mode, search]);

  // ── Render ──
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-primary font-headline">Daftar Mahasiswa</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Jatah kamu: <span className="font-semibold text-foreground">{jatahSelesai}/{jatahTotal}</span> selesai
        </p>
      </div>

      <JatahProgressBar
        jatahSelesai={jatahSelesai}
        jatahTotal={jatahTotal}
        jatahSudahSelesai={jatahSudahSelesai}
      />

      <SesiFilter
        sesiList={sesiList}
        selectedSesiId={selectedSesiId}
        onSelect={(id) => { setSelectedSesiId(id); setPage(1); }}
        canEdit={canEdit}
      />

      <ModeFilterTabs
        mode={mode}
        onModeChange={setMode}
        jatahSudahSelesai={jatahSudahSelesai}
        total={total}
      />

      <SearchInput value={search} onChange={setSearch} />

      <LockedAlert locked={locked} jatahSelesai={jatahSelesai} jatahTotal={jatahTotal} />

      <MahasiswaTable
        data={data}
        loading={loading}
        locked={locked}
        canEdit={canEdit}
        mode={mode}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
