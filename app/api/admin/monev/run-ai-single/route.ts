import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

function cleanAmount(amountStr: string | number): number {
  if (typeof amountStr === "number") return amountStr;
  const digits = amountStr.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

async function processIncomeDoc(signedUrl: string, docType: "slip_gaji" | "surat_pernyataan") {
  if (docType === "slip_gaji" && process.env.AI_API_SLIP_GAJI) {
    try {
      const res = await fetch(process.env.AI_API_SLIP_GAJI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: signedUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.match_count > 0 && data.final_strings?.length > 0) {
          return {
            source: "slip_gaji",
            amount: cleanAmount(data.final_strings[0]),
            raw: data,
          };
        }
      }
    } catch (e) {
      console.error("[AI] Slip Gaji Error:", e);
    }
  }

  if (docType === "surat_pernyataan" && process.env.AI_API_SURAT_PERNYATAAN) {
    try {
      const res = await fetch(process.env.AI_API_SURAT_PERNYATAAN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: signedUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.amount) {
          return {
            source: "surat_pernyataan",
            amount: cleanAmount(data.amount),
            raw: data,
          };
        }
      }
    } catch (e) {
      console.error("[AI] Surat Pernyataan Error:", e);
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    await requireAdminRole();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengisian required" }, { status: 400 });
    }

    const { data: record, error: fetchErr } = await supabaseAdmin
      .from("pengisian_monev")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !record) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const getSignedUrl = async (path: string | null) => {
      if (!path) return null;
      const { data } = await supabaseAdmin.storage
        .from("monev")
        .createSignedUrl(path, 300);
      return data?.signedUrl || null;
    };

    const urlKK = await getSignedUrl(record.path_scan_kk);
    const urlAyah = await getSignedUrl(record.path_bukti_penghasilan_ayah);
    const urlIbu = await getSignedUrl(record.path_bukti_penghasilan_ibu);
    const urlLain = await getSignedUrl(record.path_bukti_penghasilan_lain);

    const aiResults: any = {};
    let isAnomali = false;
    let deteksiYoloKK: number | null = null;

    if (urlKK && process.env.AI_API_BARIS_KK) {
      try {
        const res = await fetch(process.env.AI_API_BARIS_KK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url: urlKK }),
        });
        if (res.ok) {
          const data = await res.json();
          aiResults.kk = data;
          deteksiYoloKK = data.match_count;
          
          if (deteksiYoloKK !== record.jumlah_tanggungan) {
            isAnomali = true;
          }
        }
      } catch (e) {
        console.error("[AI] KK Error:", e);
      }
    }

    const [hasilAyah, hasilIbu, hasilLain] = await Promise.all([
      urlAyah ? processIncomeDoc(urlAyah, "slip_gaji") : Promise.resolve(null),
      urlIbu ? processIncomeDoc(urlIbu, "slip_gaji") : Promise.resolve(null),
      urlLain ? processIncomeDoc(urlLain, "surat_pernyataan") : Promise.resolve(null),
    ]);

    if (hasilAyah) {
      aiResults.gaji_ayah = hasilAyah;
      if (Math.abs(hasilAyah.amount - Number(record.penghasilan_ayah)) > 10000) {
        isAnomali = true;
      }
    }

    if (hasilIbu) {
      aiResults.gaji_ibu = hasilIbu;
      if (Math.abs(hasilIbu.amount - Number(record.penghasilan_ibu)) > 10000) {
        isAnomali = true;
      }
    }

    if (hasilLain) {
      aiResults.penghasilan_lain = hasilLain;
      if (Math.abs(hasilLain.amount - Number(record.penghasilan_lain)) > 10000) {
        isAnomali = true;
      }
    }
    
    const { error: updateErr } = await supabaseAdmin
      .from("pengisian_monev")
      .update({
        hasil_deteksi_yolo: deteksiYoloKK,
        hasil_scan_ai: Object.keys(aiResults).length > 0 ? aiResults : null,
        status_anomali: isAnomali,
      })
      .eq("id", id);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      hasil_deteksi_yolo: deteksiYoloKK,
      status_anomali: isAnomali,
      aiResults,
    });

  } catch (error: any) {
    console.error("[AI] Orchestrator Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
