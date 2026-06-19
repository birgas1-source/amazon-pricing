// Apify Webhook: Called when EG scrape run completes
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const APIFY_TOKEN = process.env.APIFY_TOKEN || process.env.VITE_APIFY_TOKEN
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || process.env.VITE_TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'amazon-pricing-webhook-2026'
const OUR_SELLER = process.env.VITE_SELLER_NAME || process.env.SELLER_NAME || 'YOUR_SELLER_NAME'
const OUR_SELLER_ID = process.env.VITE_SELLER_ID || process.env.SELLER_ID || 'YOUR_SELLER_ID'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    })
  } catch (err) { console.error('Telegram error:', err) }
}

async function getRunResults(datasetId) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=10000`)
  return await res.json()
}

export default async function handler(req, res) {
  if (req.query.secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { resource } = req.body
    if (!resource) return res.status(200).json({ ok: true })

    if (resource.status !== 'SUCCEEDED') {
      await sendTelegram(`⚠️ Apify run EG ${resource.status}\nRun ID: ${resource.id?.substring(0,12)}`)
      const { data: state } = await supabase.from('scrape_state').select('*').eq('market', 'eg').single()
      if (state) {
        await supabase.from('scrape_state').update({
          completed_batches: (state.completed_batches || 0) + 1,
        }).eq('market', 'eg')
      }
      return res.status(200).json({ ok: true })
    }

    const datasetId = resource.defaultDatasetId
    const results = await getRunResults(datasetId)
    if (!Array.isArray(results)) {
      return res.status(200).json({ ok: true })
    }

    const { data: state } = await supabase.from('scrape_state').select('*').eq('market', 'eg').single()
    if (!state) return res.status(200).json({ ok: true })

    const prevListedAsins = state.prev_data?.prevListedAsins || []
    const totalProducts = state.prev_data?.totalProducts || 0
    const prevListedSet = new Set(prevListedAsins)

    // Group by asin
    const byAsin = {}
    for (const row of results) {
      if (!byAsin[row.asin]) byAsin[row.asin] = []
      byAsin[row.asin].push(row)
    }

    // Load friend sellers (to auto-reject products they sell)
    const { data: friendsData } = await supabase.from('friend_sellers').select('seller_id, seller_name')
    const friendsById = Object.fromEntries((friendsData || []).map(f => [f.seller_id, f.seller_name]))

    let processedCount = 0
    const alerts = []
    const histories = []

    for (const [asin, sellers] of Object.entries(byAsin)) {
      const buyBox = sellers.find(s => s.buy_box)
      const us = sellers.find(s => s.seller_name === OUR_SELLER || s.seller === OUR_SELLER_ID)
      const buyBoxPrice = buyBox?.price ? parseFloat(String(buyBox.price).replace(/,/g, '')) : null
      const ourPrice = us?.price ? parseFloat(String(us.price).replace(/,/g, '')) : null

      // Delete old sellers + insert new
      await supabase.from('product_sellers').delete().eq('asin', asin)
      const sellerRows = sellers.map(s => ({
        asin,
        seller_id: s.seller || null,
        seller_name: s.seller_name || null,
        price_egp: s.price ? parseFloat(String(s.price).replace(/,/g, '')) : null,
        position: s.position || null,
        is_buy_box: !!s.buy_box,
        is_us: s.seller_name === OUR_SELLER || s.seller === OUR_SELLER_ID,
        rating_text: s.reviews?.[0] || null,
        rating_count: s.reviews?.[1] || null,
        positive_pct: s.reviews?.[2] || null,
        delivery_date: s.deliveries?.[0]?.date || null,
        asin_total_sellers: s.asin_total_sellers || sellers.length,
      }))
      if (sellerRows.length) await supabase.from('product_sellers').insert(sellerRows)

      // Update EG summary
      await supabase.from('product_eg_data').upsert({
        asin,
        price_egp: buyBoxPrice,
        buy_box_seller: buyBox?.seller_name || null,
        buy_box_seller_id: buyBox?.seller || null,
        buy_box_position: buyBox?.position || null,
        total_sellers: sellers[0]?.asin_total_sellers || sellers.length,
        our_position: us?.position || null,
        our_price_egp: ourPrice,
        is_our_listing: !!(us && us.buy_box),
        last_scraped_eg: new Date().toISOString(),
      }, { onConflict: 'asin' })

      if (us) {
        await supabase.from('products').update({ awaiting_listing: false }).eq('asin', asin)
      }

      // Auto-reject if a friend seller is selling this product
      const friendSeller = sellers.find(s => friendsById[s.seller])
      if (friendSeller) {
        await supabase.from('products').update({
          rejected: true,
          rejection_reason: `صديق بيبيعه (${friendsById[friendSeller.seller]})`,
        }).eq('asin', asin)
      }

      histories.push({
        asin,
        price_egp: buyBoxPrice,
        buy_box_seller: buyBox?.seller_name || null,
        our_price_egp: ourPrice,
        source: 'eg_update',
      })

      if (prevListedSet.has(asin) && !us) {
        alerts.push({ asin, alert_type: 'delisted', old_value: null, new_value: null })
      }

      processedCount++
    }

    if (histories.length) await supabase.from('price_history').insert(histories)
    if (alerts.length) await supabase.from('price_alerts').insert(alerts)

    // Atomic update with optimistic locking
    let isLastBatch = false
    let finalState = null
    let retries = 0
    const MAX_RETRIES = 10

    while (retries < MAX_RETRIES) {
      const { data: currentState } = await supabase
        .from('scrape_state')
        .select('*')
        .eq('market', 'eg')
        .single()

      if (!currentState) break

      const currentCompleted = currentState.completed_batches || 0
      const existingAlerts = currentState.all_alerts || []

      const { data: updated } = await supabase
        .from('scrape_state')
        .update({
          completed_batches: currentCompleted + 1,
          all_alerts: [...existingAlerts, ...alerts],
          products_updated: (currentState.products_updated || 0) + processedCount,
        })
        .eq('market', 'eg')
        .eq('completed_batches', currentCompleted)
        .select()
        .maybeSingle()

      if (updated) {
        finalState = updated
        isLastBatch = updated.completed_batches >= updated.total_batches
        break
      }

      retries++
      await new Promise(r => setTimeout(r, 100 + Math.random() * 300))
    }

    if (!finalState) {
      return res.status(200).json({ ok: true, warning: 'state_update_failed' })
    }

    // Final summary if all batches done
    if (isLastBatch) {
      const totalUpdatedCount = finalState.products_updated
      const combinedAlerts = finalState.all_alerts || []
      const minExpected = Math.max(10, Math.floor(totalProducts * 0.3))
      if (totalUpdatedCount < minExpected) {
        await sendTelegram(
          `⚠️ تحديث EG فشل\n` +
          `الـ scrape رجع ${totalUpdatedCount}/${totalProducts} منتج فقط.\n` +
          `الحماية مفعلة.`
        )
      } else {
        let msg = `🤖 تحديث EG التلقائي\n`
        msg += `━━━━━━━━━━━━━━━\n`
        msg += `✅ تم تحديث ${totalUpdatedCount}/${totalProducts} منتج\n\n`

        if (combinedAlerts.length) {
          msg += `🟠 مبقاش معروض في الإمارات (${combinedAlerts.length}):\n`
          for (const a of combinedAlerts.slice(0, 20)) {
            msg += `• ${a.asin}\n`
          }
          if (combinedAlerts.length > 20) msg += `  ...+${combinedAlerts.length - 20} أكتر\n\n`
          else msg += `\n`
          msg += `━━━━━━━━━━━━━━━\n🔔 إجمالي التنبيهات: ${combinedAlerts.length}`
        } else {
          msg += `✨ مفيش أي تنبيهات — كل المنتجات لسه معروضة`
        }
        await sendTelegram(msg)
      }

      await supabase.from('scrape_state').update({
        completed_at: new Date().toISOString(),
      }).eq('market', 'eg')
    }

    return res.status(200).json({ ok: true, processed: processedCount, alerts: alerts.length, is_last: isLastBatch })
  } catch (err) {
    console.error('Webhook EG error:', err)
    await sendTelegram(`❌ خطأ في معالجة webhook EG:\n${err.message}`)
    return res.status(500).json({ error: err.message })
  }
}

export const config = { maxDuration: 300 }
