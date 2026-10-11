// Tarea programada: campañas programadas y secuencias automáticas.
// Se invoca por cron con el header x-cron-secret, o manualmente por un administrador.
import { corsHeaders, json, requireAdmin, serviceClient } from '../_shared/http.ts'
import { getEmailConfig, isEmailConfigured, sendCampaignEmail } from '../_shared/email.ts'
import { dispatchCampaign } from '../_shared/campaigns.ts'
import { automationGuard } from '../_shared/rules.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const db = serviceClient()
  const secret = Deno.env.get('CRON_SECRET')
  const byCron = Boolean(secret) && req.headers.get('x-cron-secret') === secret
  if (!byCron && !(await requireAdmin(req, db))) return json({ error: 'No autorizado.' }, 401)

  const config = await getEmailConfig(db)
  if (!isEmailConfigured(config)) return json({ error: 'El servicio de email no está configurado.' }, 503)
  const now = new Date().toISOString()
  const summary = { campaigns: 0, sent: 0, stopped: 0, completed: 0, failed: 0 }

  // 1. Campañas programadas cuya hora llegó, o envíos por lotes que quedaron a medias.
  const { data: due } = await db.from('campaigns').select('id')
    .or(`and(status.eq.programada,scheduled_at.lte.${now}),status.eq.enviando`).limit(3)
  for (const c of due ?? []) {
    await dispatchCampaign(db, config, c.id)
    summary.campaigns++
  }

  // 2. Inscripciones a automatizaciones con un paso pendiente.
  const { data: enrollments } = await db.from('automation_enrollments')
    .select(`id, current_step, enrolled_at, order_id,
      automation:automations(id, key, enabled, requires_marketing_consent),
      contact:contacts(id, first_name, last_name, email, marketing_consent, unsubscribe_token)`)
    .eq('status', 'activa').lte('next_run_at', now).limit(50)

  for (const e of enrollments ?? []) {
    // deno-lint-ignore no-explicit-any
    const automation = e.automation as any, contact = e.contact as any
    if (!automation || !contact) continue

    const { data: paid } = await db.rpc('paid_orders_count', { p_contact: contact.id })
    let orderPaymentStatus: string | null = null
    if (e.order_id) {
      const { data: pay } = await db.from('payments').select('status').eq('order_id', e.order_id).limit(1).maybeSingle()
      orderPaymentStatus = pay?.status ?? null
    }
    const guard = automationGuard({
      automationKey: automation.key,
      enabled: automation.enabled,
      requiresMarketingConsent: automation.requires_marketing_consent,
      marketingConsent: contact.marketing_consent,
      paidOrders: paid ?? 0,
      orderPaymentStatus,
    })
    if (!guard.send) {
      if (guard.stop) {
        await db.from('automation_enrollments')
          .update({ status: 'detenida', stop_reason: guard.stop, updated_at: now }).eq('id', e.id)
        summary.stopped++
      }
      continue
    }

    const { data: steps } = await db.from('automation_steps').select('*')
      .eq('automation_id', automation.id).gte('step_order', e.current_step + 1).order('step_order').limit(2)
    const [step, next] = steps ?? []
    if (!step) {
      await db.from('automation_enrollments').update({ status: 'completada', updated_at: now }).eq('id', e.id)
      continue
    }

    const result = await sendCampaignEmail(db, config, {
      subject: step.subject, html: step.html, commercial: automation.requires_marketing_consent,
      recipient: contact, kind: 'automatizacion',
    })
    if (!result.ok) { summary.failed++; continue }
    summary.sent++

    if (next) {
      const nextRun = new Date(new Date(e.enrolled_at).getTime() + next.delay_days * 86_400_000).toISOString()
      await db.from('automation_enrollments')
        .update({ current_step: step.step_order, next_run_at: nextRun, updated_at: now }).eq('id', e.id)
    } else {
      await db.from('automation_enrollments')
        .update({ current_step: step.step_order, status: 'completada', updated_at: now }).eq('id', e.id)
      summary.completed++
    }
  }

  return json(summary)
})
