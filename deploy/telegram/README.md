# Pengingat Monev Telegram — Panduan Deploy & Acuan

Dokumen acuan tunggal untuk fitur pengingat Telegram SAKTI.
Kalau ada perbedaan dengan PRD atau catatan lain, **ikuti dokumen ini**.

Terakhir diperbarui: 7 Oktober 2026.

---

## 1. Cara kerja fitur

```text
Mahasiswa (browser) ─┐
                     ├─ HTTPS ─▶ Nginx ─▶ 127.0.0.1:3000 (SAKTI)
Telegram (webhook) ──┘             └─ /api/cron/* diblokir (404)

Cron VPS 08:00 WIB ──────────────────▶ 127.0.0.1:3000/api/cron/monev-reminder
SAKTI ───────────────────────────────▶ api.telegram.org (kirim pesan)
```

1. Mahasiswa membuka **Monev → Pengingat Telegram**, lalu memilih salah satu jalur aktivasi:
   - **Buka Bot Telegram** — untuk aplikasi Telegram di HP atau desktop
   - **Pakai Telegram Web** — untuk web.telegram.org
   - **Scan QR** — SAKTI dibuka di laptop, Telegram ada di HP
   - **Pakai kode manual** — cadangan terakhir
2. Mahasiswa menekan Start di bot. Telegram mengirim `/start <kode>` ke `https://<domain>/api/telegram`, lalu SAKTI menyimpan `telegram_id` mahasiswa tersebut.
3. Setiap hari pukul 08:00 WIB, cron di VPS memanggil endpoint pengingat. SAKTI mengirim pesan pada H-30, H-7, H-3, H-2, dan H-1 sebelum deadline, hanya kepada mahasiswa yang belum mengisi Monev.

---

## 2. Status

| Bagian | Status |
|---|---|
| Kode backend (webhook, aktivasi, status, putus koneksi, cron) | ✅ Selesai |
| UI panel Pengingat Telegram (4 jalur aktivasi, QR, putus koneksi) | ✅ Selesai |
| Kode di-commit dan di-push ke GitHub | ⬜ **Belum** |
| `pnpm build` lolos | ⬜ **Belum** — gagal karena masalah di luar fitur ini (lihat 4.1) |
| VPS: domain, Nginx, HTTPS, pm2, webhook, cron | ⬜ Belum |
| SQL keamanan di Supabase | ⬜ Belum |
| Uji payload Telegram Web (lihat 7.3) | ⬜ Belum |

---

## 3. Keputusan yang sudah final

Jangan diubah tanpa alasan baru. Setiap baris pernah dipertimbangkan alternatifnya.

| Keputusan | Alasan |
|---|---|
| **Satu bot** (`@MonevSakaBot`) dipakai laptop dan VPS | Tidak perlu bot kedua. `pnpm telegram:setup` menolak jalan kalau URL-nya `localhost`, jadi laptop tidak bisa merebut webhook dari VPS. |
| **DuckDNS + Nginx + Let's Encrypt**, bukan cloudflared | VPS punya IP publik dan port bisa dibuka. Penyebab bot mati dulu adalah tunnel sementara cloudflared yang URL-nya berganti. |
| **DuckDNS**, bukan nip.io/sslip.io | nip.io/sslip.io tidak ada di Public Suffix List, jadi penerbitan sertifikat Let's Encrypt hampir pasti gagal. |
| Domain `.my.id` **belum** dipakai | Bisa dipindah kapan saja dalam ±5 menit (lihat bagian 10). |
| SAKTI hanya mendengarkan di `127.0.0.1:3000` | Satu-satunya pintu dari internet adalah Nginx. |
| Cron dipanggil lewat `127.0.0.1`, `/api/cron/*` diblokir Nginx | Cron tidak bisa dipicu dari luar. |
| Berkas env **disalin** dari laptop (`scp`), bukan diketik ulang | SAKTI butuh `.env` **dan** `.env.local`. Mengetik ulang rawan ada kunci yang tertinggal (SMTP, service role key). |
| pm2 menjalankan `node_modules/next/dist/bin/next` | `node_modules/.bin/next` adalah skrip shell, dan pm2 gagal menjalankannya. |
| Cron **sekali sehari** | Logika coba-ulang sudah ada di kode. Kalau semua kiriman gagal, log tidak dicatat sehingga hari berikutnya dicoba lagi. |

---

## 4. Di laptop (sebelum ke VPS)

### 4.1 Pastikan build lolos

```bash
pnpm build
```

Saat ini **gagal**, karena dua masalah yang tidak berhubungan dengan fitur Telegram:

- `app/mahasiswa/(main)/pengaduan/page.tsx` mengimpor 4 komponen yang terhapus di commit `6cbfb20`. Halaman ini tidak ditautkan dari mana pun; fitur aduan yang aktif ada di `/layanan-aduan` dan `/cek-aduan`.
- 11 error tipe di portal pewawancara (`app/pewawancara/...`, `components/pewawancara/detail/...`).

Selama build masih gagal di laptop, build di VPS juga pasti gagal.

### 4.2 Commit dan push

```bash
git add -A
git commit -m "feat(telegram): perbaikan pengingat Monev & aktivasi Telegram Web"
git push
```

`.env` dan `.env.local` tidak ikut ter-push karena sudah ada di `.gitignore`. Repo `azzm04/sakti-fullstack` itu **publik**, jadi jangan pernah meng-commit token atau password.

### 4.3 Ganti token bot

Token lama sempat beredar lewat tunnel sementara, jadi harus dicabut.

1. Buka [@BotFather](https://t.me/BotFather) → `/mybots` → **MonevSakaBot** → *API Token* → **Revoke current token**
2. Ganti nilai `TELEGRAM_BOT_TOKEN` di `.env.local` laptop dengan token baru

### 4.4 Buat nama domain di DuckDNS

1. Buka <https://www.duckdns.org> dan login dengan Google atau GitHub
2. Isi nama, misalnya `sakti-undip`, lalu klik **add domain**
3. Isi **IP publik VPS** di kolom *current ip*, lalu klik **update ip**

Hasilnya: `sakti-undip.duckdns.org`.

---

## 5. Di VPS

Jalankan sebagai user biasa yang bisa `sudo`, bukan root.

### 5.1 Simpan dua nilai dan periksa VPS

```bash
export DOMAIN="sakti-undip.duckdns.org"     # ganti dengan nama DuckDNS Anda
export SAKTI_DIR="$HOME/sakti-fullstack"
```

> Ulangi dua baris `export` ini setiap kali login SSH lagi, karena nilainya hilang saat sesi ditutup.

```bash
sudo ss -ltnp | grep -E ':(80|443|3000)\b'   # siapa yang memakai port ini
pgrep -a cloudflared                          # tunnel lama masih jalan?
node -v                                       # minimal v20.9
dig +short "$DOMAIN"; curl -s ifconfig.me; echo
```

- Kalau masih ada `cloudflared` jalan, matikan dengan `sudo pkill cloudflared`.
- Kalau port 80/443 sudah dipakai program lain, **berhenti** dan cari tahu dulu program apa itu.
- Kalau Node tidak ada atau versinya di bawah 20.9:

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

✅ Lanjut kalau `dig` dan `curl ifconfig.me` mengeluarkan **IP yang sama**.

### 5.2 Firewall

Urutannya wajib seperti ini. Kalau `ufw enable` dijalankan sebelum SSH diizinkan, Anda terkunci keluar dari VPS.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw enable
sudo ufw status
```

✅ Muncul `OpenSSH ALLOW`, `80 ALLOW`, `443 ALLOW`, `3000 DENY`, dan sesi SSH Anda tidak terputus.

### 5.3 Ambil kode

Kalau folder kode **belum ada** di VPS:

```bash
git clone -b refactor/sync-database-schema https://github.com/azzm04/sakti-fullstack.git "$SAKTI_DIR"
```

Kalau **sudah ada**:

```bash
cd "$SAKTI_DIR"
git fetch
git checkout refactor/sync-database-schema
git pull
```

✅ `ls "$SAKTI_DIR/deploy/telegram"` menampilkan berkas README ini.

### 5.4 Salin berkas env dari laptop

Jalankan **di laptop**, dari folder proyek (Git Bash atau PowerShell):

```bash
scp .env .env.local <user-vps>@<ip-vps>:~/sakti-fullstack/
```

Contoh: `scp .env .env.local ubuntu@103.10.20.30:~/sakti-fullstack/`

Kembali **di VPS**, ganti tiga nilai yang memang harus berbeda dari laptop:

```bash
cd "$SAKTI_DIR"
chmod 600 .env .env.local
sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" .env.local
sed -i "s|^TELEGRAM_WEBHOOK_SECRET=.*|TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)|" .env.local
sed -i "s|^CRON_SECRET=.*|CRON_SECRET=$(openssl rand -hex 32)|" .env.local
```

| Nilai | Laptop | VPS |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://<domain>` |
| `TELEGRAM_WEBHOOK_SECRET` | nilai laptop | nilai baru |
| `CRON_SECRET` | nilai laptop | nilai baru |
| Semua nilai lain (token bot, database, SMTP, dll.) | sama | sama |

✅ `grep '^NEXT_PUBLIC_APP_URL=' .env.local` menampilkan `https://<domain>`, dan `ls -l .env*` menunjukkan izin `-rw-------`.

### 5.5 Build dan jalankan

```bash
cd "$SAKTI_DIR"
command -v pnpm || sudo npm install -g pnpm
command -v pm2  || sudo npm install -g pm2

pnpm install --frozen-lockfile
pnpm build

pm2 delete sakti 2>/dev/null
pm2 start node_modules/next/dist/bin/next --name sakti -- start -H 127.0.0.1 -p 3000
pm2 save
pm2 startup        # jalankan perintah sudo yang dicetaknya
```

✅ `curl -s http://127.0.0.1:3000/api/telegram` → `{"ok":true}`

### 5.6 Nginx dan HTTPS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo cp "$SAKTI_DIR/deploy/telegram/nginx-sakti.conf" /etc/nginx/sites-available/sakti
sudo sed -i "s/sakti\.example\.org/$DOMAIN/g" /etc/nginx/sites-available/sakti
sudo ln -sf /etc/nginx/sites-available/sakti /etc/nginx/sites-enabled/sakti
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d "$DOMAIN" --dry-run    # uji dulu, tidak memakai jatah
sudo certbot --nginx -d "$DOMAIN"              # pilih "Redirect" saat ditanya
```

`--dry-run` dijalankan lebih dulu karena Let's Encrypt membatasi jumlah percobaan yang gagal. Konfigurasi Nginx dari repo sengaja hanya HTTP; certbot yang menambahkan bagian HTTPS-nya.

✅ Hasil yang diharapkan:

```bash
curl -s "https://$DOMAIN/api/telegram"                                               # {"ok":true}
curl -s -o /dev/null -w '%{http_code}\n' "https://$DOMAIN/api/cron/monev-reminder"   # 404
```

### 5.7 Daftarkan webhook

```bash
cd "$SAKTI_DIR"
pnpm telegram:setup
```

✅ Keluar `url : https://<domain>/api/telegram`, `last_error : -`, dan `health check : OK`. Kirim `/start` ke @MonevSakaBot, dan bot membalas petunjuk aktivasi.

### 5.8 Cron pengingat

```bash
sudo mkdir -p /opt/sakti /etc/sakti /var/log/sakti
sudo cp "$SAKTI_DIR/deploy/telegram/cron-monev-reminder.sh" /opt/sakti/

CS="$(grep '^CRON_SECRET=' "$SAKTI_DIR/.env.local" | cut -d= -f2- | tr -d '"')"
printf 'CRON_SECRET=%s\nSAKTI_LOCAL_URL=http://127.0.0.1:3000\n' "$CS" | sudo tee /etc/sakti/cron.env >/dev/null
unset CS

sudo chown -R "$USER:$USER" /opt/sakti /etc/sakti /var/log/sakti
chmod 750 /opt/sakti/cron-monev-reminder.sh
chmod 600 /etc/sakti/cron.env

( crontab -l 2>/dev/null | grep -v -e monev-reminder -e trycloudflare; \
  echo "0 1 * * * /opt/sakti/cron-monev-reminder.sh" ) | crontab -
crontab -l
```

`0 1 * * *` = 01:00 UTC = **08:00 WIB**.

✅ `crontab -l` memuat satu baris `monev-reminder`, dan tidak ada baris yang menyebut `trycloudflare`.

---

## 6. Di Supabase

Buka **SQL Editor**, lalu jalankan isi `supabase/telegram_security.sql` **blok demi blok**:

1. Cek status RLS saat ini.
2. Cek `tableowner`. Hasilnya harus sama dengan user di `DATABASE_URL`. **Kalau berbeda, jangan jalankan blok RLS**, karena Prisma bisa ikut terblokir.
3. Aktifkan RLS.
4. Hapus kode aktivasi format lama (sekarang disimpan dalam bentuk hash).
5. Cek duplikat `telegram_id`, lalu buat unique index.

✅ Setelahnya `https://<domain>` masih bisa dibuka dan login berjalan.

---

## 7. Uji

### 7.1 Sebelum menguji cron

Database laptop dan VPS sama, jadi cron mengirim ke mahasiswa sungguhan. Cek dulu siapa yang terdaftar:

```sql
select nama, telegram_id from penerima_kipk where telegram_id is not null;
```

Lalu uji sekali:

```bash
/opt/sakti/cron-monev-reminder.sh; tail -1 /var/log/sakti/monev-reminder.log    # HTTP 200
```

### 7.2 Aktivasi

Buka `https://<domain>` → login sebagai mahasiswa → **Monev** → **Pengingat Telegram**:

- [ ] **Buka Bot Telegram** (di HP) → Start → status berubah jadi terhubung dalam ≤ 5 detik
- [ ] **Pakai Telegram Web** → Start → terhubung
- [ ] **Scan QR** → pindai dengan HP → Start → terhubung
- [ ] **Pakai kode manual** → salin kode → kirim ke bot → terhubung
- [ ] Di bot: `/status` menampilkan jadwal, `/stop` memutus koneksi

### 7.3 Uji khusus Telegram Web

Tes ini menentukan apakah jalur Telegram Web membawa kode sampai ke bot. Di browser yang sudah login Telegram Web, buka:

```text
https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DMonevSakaBot%26start%3DZZZZ2345
```

Tekan Start, lalu lihat balasan bot:

| Balasan bot | Artinya |
|---|---|
| "Kode tidak valid atau sudah kedaluwarsa" | Kode **sampai**. Jalur Telegram Web berfungsi. |
| Pesan sambutan + petunjuk | Kode **hilang**. Mahasiswa pengguna web memakai QR atau kode manual. |

### 7.4 Tahan reboot

```bash
sudo reboot
# tunggu ±1 menit, login SSH lagi, isi ulang export DOMAIN
pm2 ls                                     # sakti: online
curl -s "https://$DOMAIN/api/telegram"     # {"ok":true}
```

---

## 8. Update kode di kemudian hari

Setiap ada perubahan yang sudah di-push:

```bash
cd ~/sakti-fullstack
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart sakti
```

Webhook dan cron **tidak perlu** didaftarkan ulang, kecuali domain berubah.

---

## 9. Kalau ada yang gagal

| Gejala | Yang dicek |
|---|---|
| `pnpm build` gagal | Pastikan dulu build lolos di laptop (4.1) |
| `pm2 ls` → errored | `pm2 logs sakti --lines 50` |
| `https://` → 502 | Aplikasi mati: `pm2 ls`, `curl http://127.0.0.1:3000/api/telegram` |
| certbot gagal "Timeout" | DNS belum menunjuk VPS (`dig +short $DOMAIN`), atau port 80 tertutup |
| certbot gagal "too many failed authorizations" | Tunggu 1 jam, perbaiki penyebabnya, ulangi dengan `--dry-run` |
| Bot diam | `pnpm telegram:setup --info` → baca `last_error`; `pm2 logs sakti \| grep telegram` |
| Log berisi "secret token tidak cocok" | Jalankan ulang `pnpm telegram:setup` |
| Cron `HTTP 401` | `CRON_SECRET` di `/etc/sakti/cron.env` beda dengan `.env.local` → ulangi 5.8 |
| Cron `HTTP 000` | Aplikasi tidak jalan di `127.0.0.1:3000` |
| Login/unggah berkas error setelah SQL | RLS memblokir Prisma → cek `tableowner` di bagian 6 |

Perintah diagnosis yang paling sering dipakai:

```bash
pm2 logs sakti --lines 50
sudo tail -50 /var/log/nginx/error.log
tail -20 /var/log/sakti/monev-reminder.log
pnpm telegram:setup --info
```

---

## 10. Pindah ke domain sendiri (`.my.id`)

```bash
export DOMAIN_LAMA="sakti-undip.duckdns.org"
export DOMAIN_BARU="sakti.domainanda.my.id"

# 1. Arahkan A record domain baru ke IP VPS, tunggu sampai cocok
dig +short "$DOMAIN_BARU"

# 2. Ganti nama di Nginx dulu, baru certbot
sudo sed -i "s/$DOMAIN_LAMA/$DOMAIN_BARU/g" /etc/nginx/sites-available/sakti
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d "$DOMAIN_BARU"

# 3. Ganti URL aplikasi dan build ulang
cd ~/sakti-fullstack
sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN_BARU|" .env.local
pnpm build && pm2 restart sakti

# 4. Daftarkan ulang webhook
pnpm telegram:setup
```

---

## 11. Peta berkas

| Berkas | Isi |
|---|---|
| `app/api/telegram/route.ts` | Webhook bot: `/start`, kode manual, `/status`, `/stop`, `/help` |
| `app/api/auth/telegram/activate/route.ts` | Membuat kode aktivasi + tautan aplikasi & Telegram Web |
| `app/api/auth/telegram/status/route.ts` | Status koneksi untuk UI |
| `app/api/auth/telegram/disconnect/route.ts` | Memutus koneksi dari web |
| `app/api/cron/monev-reminder/route.ts` | Mengirim pengingat H-30/7/3/2/1 |
| `lib/telegram.ts` | Kirim pesan, escape HTML, kode aktivasi, tautan |
| `lib/security.ts`, `lib/rate-limit.ts` | Perbandingan secret, cek Origin, batas percobaan |
| `components/mahasiswa/monev/RiwayatMonevClient.tsx` | UI panel Pengingat Telegram |
| `scripts/telegram-setup.mjs` | `pnpm telegram:setup` — daftarkan webhook |
| `deploy/telegram/nginx-sakti.conf` | Konfigurasi Nginx |
| `deploy/telegram/cron-monev-reminder.sh` | Skrip yang dipanggil cron |
| `supabase/telegram_security.sql` | RLS + pembersihan token lama |
| `.kiro/specs/telegram-monev-reminder/prd-v2.md` | PRD (latar belakang & kajian keamanan) |
