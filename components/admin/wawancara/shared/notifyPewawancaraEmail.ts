import { toast } from "sonner";

/** Tampilkan hasil kirim email penunjukan pewawancara dari respons POST /api/admin/pewawancara. */
export function notifyPewawancaraEmail(
  json: { email_sent?: boolean; email_error?: string },
  email: string,
) {
  if (json.email_sent) {
    toast.success("Pewawancara ditambahkan", {
      description: `Email pemberitahuan terkirim ke ${email}.`,
    });
  } else {
    toast.warning("Pewawancara ditambahkan, tapi email gagal terkirim", {
      description: json.email_error ?? "Periksa konfigurasi SMTP lalu beri tahu pewawancara secara manual.",
    });
  }
}
