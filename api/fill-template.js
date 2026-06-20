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
    
    const templateSheet = wb.Sheets['Template'] || wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(templateSheet, { header: 1, defval: '' })

    // Find column indices
    let asinCol = -1, priceCol = -1, skuCol = -1
    for (let i = 0; i < 10; i++) {
      const row = rows[i] || []
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j]).toLowerCase()
        if (val.includes('merchant_suggested_asin')) asinCol = j
        if (val.includes('standard_price') && priceCol === -1) priceCol = j
        if (val.includes('contribution_sku')) skuCol = j
      }
      if (asinCol >= 0 && priceCol >= 0) break
    }

    const filledAsins = []
    const notInCatalog = []

    for (let i = 4; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[asinCol]) continue
      const asin = String(row[asinCol]).trim()
      if (!asin.startsWith('B')) continue

      const pricing = products[asin]
      if (!pricing) {
        notInCatalog.push(asin)
        continue
      }

      // Set price (use max as default)
      const price = pricing.max || pricing.min
      if (price && priceCol >= 0) {
        const cellAddr = XLSX.utils.encode_cell({ r: i, c: priceCol })
        templateSheet[cellAddr] = { t: 'n', v: price }
        filledAsins.push(asin)
      }
    }

    const outBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsm' })
    const outBase64 = outBuffer.toString('base64')

    res.status(200).json({
      file: outBase64,
      filled_asins: filledAsins,
      not_in_catalog: notInCatalog,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}