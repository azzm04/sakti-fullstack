import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    // Validasi ekstensi file
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Format file harus .xlsx atau .xls" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<{
      email: string
      nama: string
      role: string
    }>(ws)

    if (rows.length === 0) {
      return NextResponse.json({ error: "File Excel kosong" }, { status: 400 })
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        if (!row.email || !row.nama) {
          failed++
          errors.push(`Baris tidak lengkap: ${JSON.stringify(row)}`)
          continue
        }

        const validRoles = ["MAHASISWA_KIPK", "PEWAWANCARA"]
        const role = validRoles.includes(row.role) ? row.role : "MAHASISWA_KIPK"

        await prisma.ssoWhitelist.upsert({
          where: { email: row.email.toLowerCase().trim() },
          create: {
            email: row.email.toLowerCase().trim(),
            nama: row.nama.trim(),
            role: role as any,
          },
          update: {
            nama: row.nama.trim(),
            isActive: true,
          },
        })
        imported++
      } catch {
        failed++
        errors.push(`Gagal import: ${row.email}`)
      }
    }

    return NextResponse.json({
      message: `Berhasil import ${imported} data, gagal ${failed}`,
      imported,
      failed,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error("[upload-whitelist]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
