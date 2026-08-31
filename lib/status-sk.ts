import { supabaseAdmin } from "@/lib/supabase";
import { randomBytes } from "crypto";

export const NIM_REGEX = /^[0-9]{14}$/;

function generateVerifikasiToken(): string {
  // 24 byte (192-bit) acak — praktis mustahil ditebak/brute-force, dipakai
  // sebagai link personal & sekali pakai di email "Lolos" (lihat
  // /api/auth/verify-kandidat/token).
  return randomBytes(24).toString("base64url");
}

export type StatusSk = "Ditetapkan" | "Tidak Ditetapkan";

export type TetapkanStatusSkResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Satu-satunya tempat yang menulis kandidat.status_sk/nim_resmi + mencatat
 * kandidat_riwayat. Dipakai baik oleh endpoint single (kartu "Penetapan SK"
 * di halaman Evaluasi) maupun endpoint bulk (tab "Penetapan SK" di Hasil Akhir)
 * supaya keduanya konsisten.
 */
export async function tetapkanStatusSk(
  kandidatId: string,
  statusSk: StatusSk,
  nimResmi: string | null | undefined,
  aktor: string,
): Promise<TetapkanStatusSkResult> {
  const nim = nimResmi?.trim() || null;

  if (statusSk === "Ditetapkan" && (!nim || !NIM_REGEX.test(nim))) {
    return { ok: false, error: "NIM resmi wajib diisi (14 digit angka) untuk status Ditetapkan" };
  }

  const updatePayload: Record<string, unknown> = {
    status_sk: statusSk,
    nim_resmi: nim,
  };

  if (statusSk === "Ditetapkan") {
    // Generate token cuma kalau belum ada — supaya link yang sudah terkirim
    // di email sebelumnya (mis. Penetapan SK dijalankan ulang) tetap valid.
    const { data: existing } = await supabaseAdmin
      .from("kandidat")
      .select("verifikasi_token")
      .eq("id", kandidatId)
      .maybeSingle();

    if (!existing?.verifikasi_token) {
      updatePayload.verifikasi_token = generateVerifikasiToken();
    }
  } else {
    // Dibatalkan admin (Tidak Ditetapkan) — link lama harus langsung mati.
    updatePayload.verifikasi_token = null;
    updatePayload.verifikasi_token_used_at = null;
  }

  const { error } = await supabaseAdmin
    .from("kandidat")
    .update(updatePayload)
    .eq("id", kandidatId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabaseAdmin.from("kandidat_riwayat").insert({
    kandidat_id: kandidatId,
    tipe: "penetapan_sk",
    deskripsi:
      statusSk === "Ditetapkan"
        ? `Ditetapkan SK resmi dengan NIM ${nim}`
        : "Ditandai Tidak Ditetapkan dalam SK resmi",
    aktor,
  });

  return { ok: true };
}
