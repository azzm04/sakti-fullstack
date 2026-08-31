import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "monev";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const FILE_FIELDS: Record<string, string> = {
  file_pekerjaan_ayah: "pekerjaan_ayah",
  file_penghasilan_ayah: "penghasilan_ayah",
  file_pekerjaan_ibu: "pekerjaan_ibu",
  file_penghasilan_ibu: "penghasilan_ibu",
  file_penghasilan_lain: "penghasilan_lain",
  file_scan_kk: "scan_kk",
};

async function uploadFile(
  file: File,
  userId: string,
  periodeId: string,
  prefix: string
): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeName = `${prefix}_${timestamp}.${ext}`;
  const storagePath = `${userId}/${periodeId}/${safeName}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload gagal (${prefix}): ${error.message}`);
  return storagePath;
}

// POST /api/monev/submit
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.sub ?? payload.id) as string;

    const formData = await req.formData();

    const periodeId = formData.get("periode_id") as string;
    const pekerjaanAyah = formData.get("pekerjaan_ayah") as string;
    const penghasilanAyah = Number(formData.get("penghasilan_ayah") || 0);
    const pekerjaanIbu = formData.get("pekerjaan_ibu") as string;
    const penghasilanIbu = Number(formData.get("penghasilan_ibu") || 0);
    const penghasilanLain = Number(formData.get("penghasilan_lain") || 0);
    const jumlahTanggungan = Number(formData.get("jumlah_tanggungan") || 1);

    if (!periodeId) {
      return NextResponse.json(
        { error: "periode_id wajib diisi" },
        { status: 400 }
      );
    }

    // Cek periode monev aktif & belum lewat deadline
    const { data: periode, error: periodeErr } = await supabaseAdmin
      .from("periode_monev")
      .select('id, "isActive", deadline')
      .eq("id", periodeId)
      .single();

    if (periodeErr || !periode) {
      return NextResponse.json(
        { error: "Periode monev tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!periode.isActive) {
      return NextResponse.json(
        { error: "Periode monev ini sudah tidak aktif" },
        { status: 400 }
      );
    }

    if (new Date(periode.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Deadline periode ini sudah lewat" },
        { status: 400 }
      );
    }

    // Cek belum pernah submit
    const { data: existing } = await supabaseAdmin
      .from("pengisian_monev")
      .select("id")
      .eq("user_id", userId)
      .eq("periode_monev_id", periodeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah mengisi evaluasi untuk periode ini" },
        { status: 409 }
      );
    }

    // Validasi scan KK wajib
    const fileScanKk = formData.get("file_scan_kk") as File | null;
    if (!fileScanKk || fileScanKk.size === 0) {
      return NextResponse.json(
        { error: "Scan Kartu Keluarga (KK) wajib diupload" },
        { status: 400 }
      );
    }

    // Validasi ukuran semua file
    for (const fieldName of Object.keys(FILE_FIELDS)) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0 && file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File ${FILE_FIELDS[fieldName]} terlalu besar. Maksimal 1 MB.`,
          },
          { status: 400 }
        );
      }
    }

    // Upload file ke Supabase Storage
    const storagePaths: Record<string, string | null> = {};

    for (const [fieldName, prefix] of Object.entries(FILE_FIELDS)) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        storagePaths[prefix] = await uploadFile(file, userId, periodeId, prefix);
      } else {
        storagePaths[prefix] = null;
      }
    }

    // Simpan ke database
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("pengisian_monev")
      .insert({
        user_id: userId,
        periode_monev_id: periodeId,
        pekerjaan_ayah: pekerjaanAyah || null,
        path_bukti_pekerjaan_ayah: storagePaths["pekerjaan_ayah"],
        penghasilan_ayah: penghasilanAyah,
        path_bukti_penghasilan_ayah: storagePaths["penghasilan_ayah"],
        pekerjaan_ibu: pekerjaanIbu || null,
        path_bukti_pekerjaan_ibu: storagePaths["pekerjaan_ibu"],
        penghasilan_ibu: penghasilanIbu,
        path_bukti_penghasilan_ibu: storagePaths["penghasilan_ibu"],
        penghasilan_lain: penghasilanLain,
        path_bukti_penghasilan_lain: storagePaths["penghasilan_lain"],
        jumlah_tanggungan: jumlahTanggungan,
        path_scan_kk: storagePaths["scan_kk"]!,
      })
      .select("id")
      .single();

    if (insertErr) {
      // Rollback storage jika DB gagal
      const pathsToDelete = Object.values(storagePaths).filter(Boolean) as string[];
      if (pathsToDelete.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(pathsToDelete);
      }
      throw insertErr;
    }

    return NextResponse.json(
      { success: true, message: "Evaluasi berhasil dikirim", id: inserted.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/monev/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal submit evaluasi" },
      { status: 500 }
    );
  }
}
