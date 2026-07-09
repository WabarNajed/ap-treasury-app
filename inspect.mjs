import { read, utils } from 'xlsx'
import { readFileSync } from 'fs'

const buf = readFileSync('data/Payment-6-7-2026-4eb9a5.xlsx')
const wb = read(buf, { cellDates: true })
console.log('SHEETS:', wb.SheetNames)
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name]
  console.log('\n==== SHEET:', name, '====')
  const rows = utils.sheet_to_json(ws, { header: 1, defval: '' })
  rows.slice(0, 40).forEach((r, i) => console.log(i, JSON.stringify(r)))
}
