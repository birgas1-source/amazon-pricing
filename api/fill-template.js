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

    let attrRowIdx = -1, asinCol = -1, priceCol = -1
    let minPriceCol = -1, maxPriceCol = -1
    let fulfillmentCol = -1, quantityCol = -1
    let handlingCol = -1, conditionCol = -1

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j] || '')
        if (val.includes('merchant_suggested_asin')) { asinCol = j; attrRowIdx = i }
        if (val.includes('our_price') && val.includes('value_with_tax')) priceCol = j
        if (val.includes('minimum_seller_allowed_price') && val.includes('value_with_tax')) minPriceCol = j
        if (val.includes('maximum_seller_allowed_price') && val.includes('value_with_tax')) maxPriceCol = j
        if (val.includes('fulfillment_channel_code')) fulfillmentCol = j
        if (val.includes('fulfillment_availability') && val.includes('quantity')) quantityCol = j
        if (val.includes('lead_time_to_ship_max_days')) handlingCol = j
        if (val.includes('condition_type')) conditionCol = j
      }
      if (attrRowIdx >= 0 && priceCol >= 0) break
    }

    const filledAsins = []
    const notInCatalog = []
    const dataStart = attrRowIdx + 2

    for (let i = dataStart; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[asinCol]) continue
      const asin = String(row[asinCol]).trim()
      if (!asin.startsWith('B')) continue

      const pricing = products[asin]
      if (!pricing) { notInCatalog.push(asin); continue }

      const maxPrice = pricing.max
      const minPrice = pricing.min

      if (maxPrice && priceCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: priceCol })] = { t: 'n', v: maxPrice }
      if (minPrice && minPriceCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: minPriceCol })] = { t: 'n', v: minPrice }
      if (maxPrice && maxPriceCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: maxPriceCol })] = { t: 'n', v: maxPrice }
      if (fulfillmentCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: fulfillmentCol })] = { t: 's', v: 'DEFAULT' }
      if (quantityCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: quantityCol })] = { t: 'n', v: 1 }
      if (handlingCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: handlingCol })] = { t: 'n', v: 5 }
      if (conditionCol >= 0)
        ws[XLSX.utils.encode_cell({ r: i, c: conditionCol })] = { t: 's', v: 'new_new' }

      filledAsins.push(asin)
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