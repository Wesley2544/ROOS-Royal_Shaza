import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

// ── Change this before printing for real use ─────────────────────
const BASE_URL = process.env.QR_BASE_URL || 'http://localhost:3000'
const TABLE_COUNT = 12

const OUT_DIR = path.join(process.cwd(), 'qr-codes-output')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR)

async function generate() {
  for (let n = 1; n <= TABLE_COUNT; n++) {
    const url = `${BASE_URL}/menu?table=${n}`
    const filePath = path.join(OUT_DIR, `table_${String(n).padStart(2, '0')}.png`)
    await QRCode.toFile(filePath, url, {
      width: 600,
      margin: 2,
      color: { dark: '#0A0A0A', light: '#FFFFFF' },
    })
    console.log(`✅ Table ${n} → ${url}`)
  }
  console.log(`\nAll QR codes saved to ${OUT_DIR}`)
}

generate()