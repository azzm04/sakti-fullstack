#!/usr/bin/env bash
# Cron pengingat Monev SAKTI — PRD v2.3 N4
# Pasang di VPS sebagai /opt/sakti/cron-monev-reminder.sh (chmod 750).
#
# Crontab (08:00 WIB = 01:00 UTC). Panduan lengkap: deploy/telegram/README.md
#   0 1 * * * /opt/sakti/cron-monev-reminder.sh
#
# Secret TIDAK ditulis di sini atau di crontab — dibaca dari /etc/sakti/cron.env
# (chmod 600, milik user yang menjalankan cron). Lihat cron.env.example.
set -euo pipefail

ENV_FILE="/etc/sakti/cron.env"
LOG_FILE="/var/log/sakti/monev-reminder.log"

set -a
# shellcheck source=/dev/null
. "$ENV_FILE"
set +a

# Panggil lewat loopback — path /api/cron/ diblokir dari internet
ENDPOINT="${SAKTI_LOCAL_URL:-http://127.0.0.1:3000}/api/cron/monev-reminder"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$RESPONSE_FILE"' EXIT

HTTP_CODE="$(curl -sS --max-time 120 -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$ENDPOINT" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" || echo 000)"

# Log ringkas saja (HTTP code + jumlah periode diproses), bukan body penuh
PROCESSED="$(grep -o '"processed":[0-9]*' "$RESPONSE_FILE" | head -1 | cut -d: -f2 || true)"
echo "[$TIMESTAMP] HTTP $HTTP_CODE processed=${PROCESSED:--}" >> "$LOG_FILE"

[ "$HTTP_CODE" = "200" ]
