import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { type EmailConfig, isEmailConfigured, sendCampaignEmail } from './email.ts'

const BATCH = 80
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Envía los destinatarios pendientes de una campaña (por lotes).
 * El consentimiento se vuelve a comprobar en el momento del envío: quien se dio
 * de baja después de programar una campaña comercial queda como "omitido".
 */
export async function dispatchCampaign(db: SupabaseClient, config: EmailConfig, campaignId: string) {
  const { data: campaign } = await db.from('campaigns').select('*').eq('id', campaignId).single()
  if (!campaign) return { error: 'Campaña no encontrada.' }
  if (!isEmailConfigured(config)) {
    await db.from('campaigns').update({ status: 'error', error: 'El servicio de email no está configurado.' }).eq('id', campaignId)
    return { error: 'El servicio de email no está configurado.' }
  }
  await db.from('campaigns').update({ status: 'enviando', error: null }).eq('id', campaignId)

  const { data: pending } = await db.from('campaign_recipients')
    .select('id, email, contact:contacts(id, first_name, last_name, email, marketing_consent, unsubscribe_token)')
    .eq('campaign_id', campaignId).eq('status', 'pendiente').limit(BATCH)

  const commercial = campaign.kind === 'comercial'
  for (const row of pending ?? []) {
    // deno-lint-ignore no-explicit-any
    const contact = row.contact as any
    if (!contact || (commercial && !contact.marketing_consent)) {
      await db.from('campaign_recipients').update({ status: 'omitido', error: 'sin_consentimiento' }).eq('id', row.id)
      continue
    }
    const result = await sendCampaignEmail(db, config, {
      subject: campaign.subject, html: campaign.html, senderName: campaign.sender_name,
      commercial, recipient: contact, campaignId, kind: 'campana',
    })
    await db.from('campaign_recipients').update(
      result.ok
        ? { status: 'enviado', provider_message_id: result.id, sent_at: new Date().toISOString() }
        : { status: 'error', error: result.error },
    ).eq('id', row.id)
    await wait(550) // respeta el límite de peticiones del proveedor
  }

  const count = async (status: string) =>
    (await db.from('campaign_recipients').select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId).eq('status', status)).count ?? 0
  const [left, sent, failed] = await Promise.all([count('pendiente'), count('enviado'), count('error')])

  if (left > 0) return { status: 'enviando', sent, failed, pending: left }
  const status = sent === 0 && failed > 0 ? 'error' : 'enviada'
  await db.from('campaigns').update({
    status,
    sent_at: new Date().toISOString(),
    error: failed > 0 ? `${failed} envío(s) con error.` : null,
  }).eq('id', campaignId)
  return { status, sent, failed, pending: 0 }
}
