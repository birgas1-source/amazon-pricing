import * as XLSX from 'xlsx'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { file, products } = req.body
    if (!file || !products) return res.status(400).json({ error: 'Missing file or products' })

    const buffer = Buffer.from(file, 'base64')
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets['Template']
    if (!ws) return res.status(400).json({ error: 'No Template sheet found' })

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    // Find attribute row (row 5 = index 4)
    let attrRowIdx = -1
    let asinCol = -1
    let priceCol = -1

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j] || '')
        if (val.includes('merchant_suggested_asin')) { asinCol = j; attrRowIdx = i }
        if (val.includes('purchasable_offer') && val.includes('our_price') && val.includes('value_with_tax')) priceCol = j
        if (val.includes('standard_price') && priceCol === -1) priceCol = j
      }
      if (attrRowIdx >= 0 && priceCol >= 0) break
    }

    const filledAsins = []
    const notInCatalog = []
    const dataStart = attrRowIdx + 2 // skip example row

    for (let i = dataStart; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[asinCol]) continue
      const asin = String(row[asinCol]).trim()
      if (!asin.startsWith('B')) continue

      const pricing = products[asin]
      if (!pricing) { notInCatalog.push(asin); continue }

      const price = pricing.max || pricing.min
      if (price && priceCol >= 0) {
        const cellAddr = XLSX.utils.encode_cell({ r: i, c: priceCol })
        ws[cellAddr] = { t: 'n', v: price }
        filledAsins.push(asin)
      }
    }

    const outBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsm' })
    res.status(200).json({
      file: outBuffer.toString('base64'),
      filled_asins: filledAsins,
      not_in_catalog: notInCatalog,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}