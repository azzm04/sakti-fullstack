import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

// PATCH — update status akun & (opsional) profil penerima_kipk.
// Role MAHASISWA_KIPK hanya boleh Read/Update/Delete dari panel admin —
// akunnya sendiri dibuat lewat alur verifikasi OTP mandiri, bukan di sini.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    // Prodi TIDAK bisa diedit di sini — kolomnya sekarang foreign key ke
    // tabel `prodi` (lookup), bukan teks bebas, dan tabel itu masih kosong.
    const { nama, nim, angkatan, status_akun } = body;

    const { data: user, error: userGetErr } = await supabaseAdmin
      .from("users")
      .select("id, user_roles!inner(role)")
      .eq("id", id)
      .eq("user_roles.role", "MAHASISWA_KIPK")
      .maybeSingle();

    if (userGetErr) throw userGetErr;
    if (!user) {
      return NextResponse.json({ error: "Akun ini bukan Mahasiswa KIP-K" }, { status: 400 });
    }

    if (status_akun !== undefined) {
      const { error: statusErr } = await supabaseAdmin
        .from("users")
        .update({ status_akun })
        .eq("id", id);
      if (statusErr) throw statusErr;
    }

    const profileUpdate: Record<string, unknown> = {};
    if (nama !== undefined) profileUpdate.nama = nama;
    if (nim !== undefined) profileUpdate.nim = nim;
    if (angkatan !== undefined) profileUpdate.angkatan = angkatan;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from("penerima_kipk")
        .upsert({ user_id: id, ...profileUpdate }, { onConflict: "user_id" });
      if (upsertErr) throw upsertErr;
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        email_sso,
        status_akun,
        created_at,
        penerima_kipk (id, nim, nama, angkatan, prodi:prodi_id ( id, nama_prodi, fakultas ))
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    const pk = one(data.penerima_kipk);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        penerima_kipk: pk ? { ...pk, prodi: one(pk.prodi) } : null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal update", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// DELETE — cabut role MAHASISWA_KIPK: hapus profil penerima_kipk (jika ada)
// & baris user_roles terkait. Akun (`users`) hanya dinonaktifkan kalau ini
// SATU-SATUNYA role user (mis. dia juga PEWAWANCARA, akun tetap aktif untuk
// akses itu) — sebelum multi-role, endpoint ini selalu menonaktifkan akun;
// sekarang itu akan salah untuk user dual-role.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: user, error: userGetErr } = await supabaseAdmin
      .from("users")
      .select("id, user_roles!inner(role)")
      .eq("id", id)
      .eq("user_roles.role", "MAHASISWA_KIPK")
      .maybeSingle();

    if (userGetErr) throw userGetErr;
    if (!user) {
      return NextResponse.json({ error: "Akun ini bukan Mahasiswa KIP-K" }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("penerima_kipk")
      .delete()
      .eq("user_id", id);

    if (deleteErr) throw deleteErr;

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", id)
      .eq("role", "MAHASISWA_KIPK");

    if (roleErr) throw roleErr;

    const { data: remainingRoles, error: remainingErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", id);

    if (remainingErr) throw remainingErr;

    if ((remainingRoles ?? []).length === 0) {
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update({ status_akun: "NONAKTIF" })
        .eq("id", id);

      if (userErr) throw userErr;
    }

    return NextResponse.json({ success: true, message: "Akun mahasiswa berhasil dihapus" });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus akun mahasiswa", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
