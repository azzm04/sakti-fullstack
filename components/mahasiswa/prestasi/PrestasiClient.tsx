"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Plus, Loader2, FileText, X, UploadCloud, ExternalLink, AlertCircle, Search, Trophy, CheckCircle2, Check } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PrestasiItem {
  id: string;
  jenis_prestasi: string;
  tingkat: string;
  nama_kegiatan: string;
  prestasi_dicapai: string;
  penyelenggara: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  url_bukti: string;
  status_verifikasi: string;
}

const TINGKAT_LABEL: Record<string, string> = {
  INTERNASIONAL: "Internasional", NASIONAL: "Nasional", PROVINSI: "Provinsi",
  KAB_KOTA: "Kabupaten/Kota", UNIVERSITAS: "Universitas", FAKULTAS: "Fakultas", PROGRAM_STUDI: "Program studi",
};
const JENIS_LABEL: Record<string, string> = {
  AKADEMIK: "Akademik", NON_AKADEMIK: "Non-akademik", ORGANISASI: "Organisasi",
  KEPANITIAAN: "Kepanitiaan", PENGABDIAN_MASYARAKAT: "Pengabdian masyarakat",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2";
const PRIMARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#000352] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1e68] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60 ${FOCUS}`;
const INPUT = `min-h-11 w-full min-w-0 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] ${FOCUS}`;
const LABEL = "mb-2 block text-[13px] font-medium text-[#334155]";

function formatTanggal(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}
function formatRentang(item: PrestasiItem) {
  const start = formatTanggal(item.tanggal_mulai);
  const end = formatTanggal(item.tanggal_selesai);
  return start === end ? start : `${start} – ${end}`;
}
async function fetchPrestasi(url: string): Promise<PrestasiItem[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Data prestasi belum dapat dimuat. Silakan coba lagi.");
  const result = await response.json();
  if (!Array.isArray(result.data)) throw new Error("Data prestasi belum dapat dimuat. Silakan coba lagi.");
  return result.data;
}
function StatusLabel({ status }: { status: string }) {
  const verified = status === "TERVERIFIKASI";
  return (
    <span className={`inline-flex items-center gap-2 text-[12px] font-medium leading-5 ${verified ? "text-[#166534]" : "text-[#475569]"}`}>
      {verified ? <Check size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" /> : <FileText size={14} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />}
      {verified ? "Terverifikasi" : "Tercatat"}
    </span>
  );
}

function FormTambahPrestasi({ userId, onClose, onSuccess, triggerRef }: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    jenis_prestasi: "AKADEMIK", tingkat: "NASIONAL", nama_kegiatan: "", prestasi_dicapai: "",
    penyelenggara: "", tanggal_mulai: "", tanggal_selesai: "",
  });
  const achievementField = form.jenis_prestasi === "ORGANISASI"
    ? { label: "Peran atau jabatan", placeholder: "Contoh: Ketua, sekretaris, atau anggota" }
    : form.jenis_prestasi === "KEPANITIAAN"
      ? { label: "Peran dalam kepanitiaan", placeholder: "Contoh: Ketua panitia atau koordinator acara" }
      : form.jenis_prestasi === "PENGABDIAN_MASYARAKAT"
        ? { label: "Peran atau kontribusi", placeholder: "Contoh: Relawan pengajar atau koordinator kegiatan" }
        : { label: "Pencapaian", placeholder: "Contoh: Juara 1, finalis, atau best paper" };
  const set = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(selected.name) || selected.size > 5 * 1024 * 1024) {
      setError("Gunakan file JPG, PNG, atau PDF dengan ukuran maksimal 5 MB.");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setError(null);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!file) { setError("Lampirkan dokumen bukti prestasi terlebih dahulu."); fileRef.current?.focus(); return; }
    if (form.tanggal_selesai < form.tanggal_mulai) { setError("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append("user_id", userId);
      data.append("file_bukti", file);
      const response = await fetch("/api/mahasiswa/prestasi", { method: "POST", body: data });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Prestasi belum berhasil disimpan. Silakan coba lagi.");
      }
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Prestasi belum berhasil disimpan. Silakan coba lagi.");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border-[#E2E8F0] bg-white p-0"
        style={{ fontFamily: "Roboto, sans-serif" }}
        onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus(); }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => { if (loading) event.preventDefault(); }}
      >
        <div className="shrink-0 border-b border-[#E2E8F0] px-5 py-5 pr-12 sm:px-7 sm:pr-12">
          <DialogTitle className="text-[20px] font-semibold leading-7 text-[#000352]">Tambah prestasi</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-5 text-[#64748B]">Lengkapi detail kegiatan dan lampirkan bukti pencapaian Anda.</DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto" aria-busy={loading}>
          <fieldset disabled={loading} className="min-w-0 space-y-6 px-5 py-6 disabled:opacity-70 sm:px-7">
            <legend className="sr-only">Data prestasi</legend>
            {error && <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] leading-5 text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
            <section aria-labelledby="prestasi-detail-heading" className="space-y-5">
              <div>
                <h3 id="prestasi-detail-heading" className="text-[14px] font-semibold text-[#000352]">Detail kegiatan</h3>
                <p className="mt-1 text-[12px] text-[#64748B]">Semua kolom wajib diisi.</p>
              </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="prestasi-kategori" className={LABEL}>Kategori</label>
                <select id="prestasi-kategori" name="jenis_prestasi" required value={form.jenis_prestasi} onChange={set} className={INPUT}>
                  {Object.entries(JENIS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prestasi-tingkat" className={LABEL}>Tingkat kegiatan</label>
                <select id="prestasi-tingkat" name="tingkat" required value={form.tingkat} onChange={set} className={INPUT}>
                  {Object.entries(TINGKAT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="prestasi-kegiatan" className={LABEL}>Nama kegiatan</label>
              <input id="prestasi-kegiatan" name="nama_kegiatan" required placeholder="Nama lomba, organisasi, atau kegiatan" value={form.nama_kegiatan} onChange={set} className={INPUT} />
            </div>
            <div>
              <label htmlFor="prestasi-pencapaian" className={LABEL}>{achievementField.label}</label>
              <input id="prestasi-pencapaian" name="prestasi_dicapai" required placeholder={achievementField.placeholder} value={form.prestasi_dicapai} onChange={set} className={INPUT} />
            </div>
            <div>
              <label htmlFor="prestasi-penyelenggara" className={LABEL}>Penyelenggara</label>
              <input id="prestasi-penyelenggara" name="penyelenggara" required placeholder="Nama instansi atau organisasi penyelenggara" value={form.penyelenggara} onChange={set} className={INPUT} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="prestasi-mulai" className={LABEL}>Tanggal mulai</label>
                <input id="prestasi-mulai" type="date" name="tanggal_mulai" required value={form.tanggal_mulai} onChange={set} className={INPUT} />
              </div>
              <div>
                <label htmlFor="prestasi-selesai" className={LABEL}>Tanggal selesai</label>
                <input id="prestasi-selesai" type="date" name="tanggal_selesai" required min={form.tanggal_mulai || undefined} value={form.tanggal_selesai} onChange={set} className={INPUT} />
              </div>
            </div>
            </section>
            <section aria-labelledby="prestasi-bukti-heading" className="border-t border-[#E2E8F0] pt-5">
              <h3 id="prestasi-bukti-heading" className="text-[14px] font-semibold text-[#000352]">Dokumen bukti</h3>
              <p id="prestasi-bukti-help" className="mt-1 text-[12px] leading-5 text-[#64748B]">Sertifikat, piagam, atau dokumen pendukung. JPG, PNG, atau PDF, maksimal 5 MB.</p>
              <input ref={fileRef} id="file-bukti-prestasi" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-label="Dokumen bukti prestasi" aria-describedby="prestasi-bukti-help" onChange={handleFileChange} className="peer sr-only" />
              {file ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-[#000352] peer-focus-visible:ring-offset-2">
                  <FileText size={20} className="shrink-0 text-[#475569]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13px] font-medium text-[#334155]">{file.name}</p>
                    <p className="mt-0.5 text-[12px] text-[#64748B]">{file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</p>
                  </div>
                  <button type="button" aria-label="Hapus dokumen bukti" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; fileRef.current?.focus(); }} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-white hover:text-red-700 ${FOCUS}`}><X size={17} /></button>
                </div>
              ) : (
                <label htmlFor="file-bukti-prestasi" className={`mt-3 flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-[13px] font-medium text-[#000352] transition-colors hover:border-[#000352] hover:bg-[#EEF2FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#000352] peer-focus-visible:ring-offset-2`}>
                  <UploadCloud size={20} strokeWidth={1.7} aria-hidden="true" />Pilih dokumen bukti
                </label>
              )}

            </section>
          </fieldset>
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-[#E2E8F0] bg-white px-5 py-4 sm:px-7">
            <button type="button" onClick={onClose} disabled={loading} className={SECONDARY}>Batal</button>
            <button type="submit" disabled={loading} className={PRIMARY}>{loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Menyimpan...</> : "Simpan prestasi"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PrestasiClient() {
  const { user, loading: userLoading } = useCurrentUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [saved, setSaved] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data, error, isLoading, mutate } = useSWR<PrestasiItem[]>(
    user?.id ? `/api/mahasiswa/prestasi?userId=${encodeURIComponent(user.id)}` : null,
    fetchPrestasi,
  );
  const loading = userLoading || isLoading;
  const items = data ?? [];
  const search = query.trim().toLocaleLowerCase("id-ID");
  const filtered = items.filter((item) => (!category || item.jenis_prestasi === category) &&
    [item.nama_kegiatan, item.prestasi_dicapai, item.penyelenggara].some((value) => value.toLocaleLowerCase("id-ID").includes(search)));
  const verified = items.filter((item) => item.status_verifikasi === "TERVERIFIKASI").length;
  const openForm = () => { setSaved(false); setIsFormOpen(true); };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" style={{ fontFamily: "Roboto, sans-serif" }}>
      <header className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-xl md:pt-6">
          <h1 className="text-3xl font-bold leading-[1.25] tracking-tight text-[#0B1536] sm:text-4xl lg:text-[40px]">
            Pendataan Prestasi <br /> KIP Kuliah
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#64748B] sm:text-lg">
            Catat pencapaian dan kontribusi Anda selama menjadi penerima KIP Kuliah Undip.
          </p>
        </div>
        <div className="relative flex w-full shrink-0 items-start justify-center self-center md:-mt-8 md:w-auto md:self-auto">
          <div className="relative flex h-56 w-72 max-w-full items-center justify-center sm:h-64 sm:w-80 md:h-72 md:w-96 lg:h-[300px] lg:w-[400px]">
            <Image
              src="/illustrations/prestasi-hero-animated.svg"
              alt="Ilustrasi prestasi dan kegiatan mahasiswa"
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 384px, (min-width: 640px) 320px, 288px"
              className="pointer-events-none select-none object-contain object-top drop-shadow-md"
              priority
            />
          </div>
        </div>
      </header>

      {saved && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800"><CheckCircle2 size={17} className="shrink-0" aria-hidden="true" />Prestasi berhasil disimpan.</p>}

      <section aria-labelledby="prestasi-list-heading" className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div>
            <h2 id="prestasi-list-heading" className="text-[20px] font-semibold leading-7 text-[#000352]">Prestasi Anda</h2>
            {data && (
              <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
                {items.length} catatan<span aria-hidden="true" className="mx-2">·</span>{verified} terverifikasi
              </p>
            )}
          </div>
          <button ref={triggerRef} type="button" onClick={openForm} disabled={!user?.id} className={`${PRIMARY} shrink-0`}>
            <Plus size={17} aria-hidden="true" />Tambah prestasi
          </button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 sm:flex-row md:px-8">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="prestasi-search" className="sr-only">Cari pencapaian, kegiatan, atau penyelenggara</label>
              <Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-[#64748B]" aria-hidden="true" />
              <input id="prestasi-search" type="search" placeholder="Cari pencapaian atau kegiatan" value={query} onChange={(event) => setQuery(event.target.value)} className={`${INPUT} pl-10`} />
            </div>
            <div className="sm:w-52">
              <label htmlFor="prestasi-category-filter" className="sr-only">Filter kategori prestasi</label>
              <select id="prestasi-category-filter" value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT}>
                <option value="">Semua kategori</option>
                {Object.entries(JENIS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div role="status" className="flex min-h-56 items-center justify-center gap-3 px-5 text-[13px] text-[#64748B]"><Loader2 size={18} className="animate-spin text-[#000352]" aria-hidden="true" />Memuat prestasi...</div>
        ) : error || !user ? (
          <div role="alert" className="px-5 py-12 text-center md:px-8">
            <AlertCircle size={24} className="mx-auto text-[#64748B]" aria-hidden="true" />
            <p className="mt-3 text-[14px] font-medium text-[#334155]">Data prestasi belum dapat dimuat</p>
            <p className="mt-1 text-[13px] text-[#64748B]">{user ? "Silakan coba kembali." : "Muat ulang halaman untuk memeriksa sesi Anda."}</p>
            {user && <button type="button" onClick={() => void mutate()} className={`${SECONDARY} mt-4`}>Coba lagi</button>}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center sm:py-16">
            <Trophy size={30} strokeWidth={1.4} className="mx-auto text-[#64748B]" aria-hidden="true" />
            <h3 className="mt-4 text-[16px] font-semibold text-[#0F172A]">Belum ada prestasi tercatat</h3>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#64748B]">Tambahkan pencapaian akademik, lomba, organisasi, atau kegiatan Anda beserta dokumen buktinya.</p>
            <button type="button" onClick={openForm} className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded text-[13px] font-medium text-[#000352] hover:underline ${FOCUS}`}><Plus size={15} aria-hidden="true" />Catat prestasi pertama</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p role="status" className="text-[14px] font-medium text-[#334155]">Tidak ada prestasi yang sesuai</p>
            <p className="mt-1 text-[13px] text-[#64748B]">Coba kata kunci atau kategori lain.</p>
            <button type="button" onClick={() => { setQuery(""); setCategory(""); }} className={`${SECONDARY} mt-4`}>Hapus pencarian dan filter</button>
          </div>
        ) : (
          <>
            {(query || category) && <p role="status" className="px-5 pt-4 text-[12px] text-[#64748B] md:px-8">Menampilkan {filtered.length} dari {items.length} prestasi</p>}
            <ul className="divide-y divide-[#E2E8F0]">
              {filtered.map((item) => (
                <li key={item.id} className="px-5 py-6 md:px-8">
                  <article className="flex min-w-0 flex-col gap-4 sm:flex-row sm:justify-between sm:gap-8">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-[16px] font-semibold leading-6 text-[#000352]">{item.nama_kegiatan}</h3>
                      <p className="mt-1 break-words text-[14px] leading-6 text-[#334155]">{item.prestasi_dicapai}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] leading-5 text-[#64748B]">
                        <span>{JENIS_LABEL[item.jenis_prestasi] ?? item.jenis_prestasi}</span>
                        <span aria-hidden="true">·</span>
                        <span>{TINGKAT_LABEL[item.tingkat] ?? item.tingkat}</span>
                      </p>
                      <dl className="mt-3 space-y-1 text-[12px] leading-5 text-[#64748B]">
                        <div><dt className="inline">Penyelenggara: </dt><dd className="inline break-words">{item.penyelenggara}</dd></div>
                        <div><dt className="sr-only">Tanggal kegiatan</dt><dd>{formatRentang(item)}</dd></div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                      <StatusLabel status={item.status_verifikasi} />
                      {item.url_bukti ? <a href={item.url_bukti} target="_blank" rel="noopener noreferrer" aria-label={`Lihat bukti ${item.prestasi_dicapai}, ${item.nama_kegiatan} (tab baru)`} className={`inline-flex min-h-11 items-center gap-2 rounded text-[12px] font-medium text-[#000352] hover:underline ${FOCUS}`}><FileText size={14} aria-hidden="true" />Lihat bukti<ExternalLink size={12} aria-hidden="true" /></a> : <span className="text-[12px] text-[#64748B]">Bukti tidak tersedia</span>}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {isFormOpen && user?.id && <FormTambahPrestasi userId={user.id} triggerRef={triggerRef} onClose={() => setIsFormOpen(false)} onSuccess={() => { setIsFormOpen(false); setSaved(true); setQuery(""); setCategory(""); void mutate(); }} />}
    </div>
  );
}