import { supabaseAdmin } from "@/lib/supabase";

export type AssignPewawancaraResult =
  | { ok: true; pewawancara: Record<string, unknown> }
  | { ok: false; error: string; status: number };

/**
 * Pastikan satu email punya role PEWAWANCARA + baris `pewawancara` yang
 * terhubung & aktif — baik user itu baru maupun sudah ada dengan role lain
 * (mis. MAHASISWA_KIPK yang direkrut jadi pewawancara).
 *
 * Dipakai bersama oleh POST /api/admin/pewawancara dan
 * POST /api/admin/users/[id]/roles (assign PEWAWANCARA) supaya tidak ada
 * 2 implementasi yang bisa divergen. Sengaja tidak cukup insert
 * `user_roles` saja: gate login pewawancara (app/api/auth/pewawancara/login)
 * juga mensyaratkan baris `pewawancara.is_active = true` — kalau cuma
 * pivot yang diisi, user lolos gate role tapi gagal di gate berikutnya
 * dengan pesan 403 yang membingungkan.
 */
export async function assignPewawancaraRole(params: {
  email: string;
  nama: string;
  adminId: string;
}): Promise<AssignPewawancaraResult> {
  const normalizedEmail = params.email.toLowerCase().trim();

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, user_roles(role)")
    .eq("email_sso", normalizedEmail)
    .maybeSingle();

  const alreadyPewawancara = (existingUser?.user_roles ?? []).some(
    (r: { role: string }) => r.role === "PEWAWANCARA",
  );
  if (alreadyPewawancara) {
    return { ok: false, error: "Email ini sudah terdaftar sebagai pewawancara", status: 409 };
  }

  let userId: string;

  if (existingUser) {
    // User sudah ada (mis. sudah MAHASISWA_KIPK) — tambahkan role, jangan
    // buat user baru.
    userId = existingUser.id;
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "PEWAWANCARA" });
    if (roleErr) return { ok: false, error: roleErr.message, status: 500 };
  } else {
    const { data: newUser, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({ email_sso: normalizedEmail, status_akun: "AKTIF" })
      .select("id")
      .single();
    if (userErr) return { ok: false, error: userErr.message, status: 500 };
    userId = newUser.id;

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "PEWAWANCARA" });
    if (roleErr) {
      await supabaseAdmin.from("users").delete().eq("id", userId); // rollback: user ini baru dibuat
      return { ok: false, error: roleErr.message, status: 500 };
    }
  }

  const { data: newPewawancara, error: pwErr } = await supabaseAdmin
    .from("pewawancara")
    .insert({ nama: params.nama, user_id: userId, admin_id: params.adminId })
    .select()
    .single();

  if (pwErr) {
    // Rollback role yang baru ditambahkan, tapi JANGAN hapus user yang
    // sudah ada sebelum request ini (bisa punya role lain).
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "PEWAWANCARA");
    if (!existingUser) {
      await supabaseAdmin.from("users").delete().eq("id", userId);
    }
    return { ok: false, error: pwErr.message, status: 500 };
  }

  return { ok: true, pewawancara: newPewawancara };
}
