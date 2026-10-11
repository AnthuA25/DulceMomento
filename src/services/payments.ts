import type { PaymentMethod, PaymentStatus, PublicSettings } from '@/types'

// Arquitectura de pagos. Hoy solo existe el proveedor manual (Yape, Plin,
// transferencia): el cliente informa su pago y un administrador lo verifica.
// Para una pasarela online basta implementar PaymentProvider y registrarla aquí;
// la confirmación de una pasarela debe llegar por webhook al backend.

export interface PaymentProvider {
  id: string
  /** Estado con el que nace un pago según lo que informó el cliente. */
  initialStatus(input: { operationNumber: string }): PaymentStatus
  /** true si el dinero se confirma sin intervención humana (pasarelas). */
  autoConfirms: boolean
}

export const manualProvider: PaymentProvider = {
  id: 'manual',
  // Un pago manual nunca se marca como pagado sin verificación.
  initialStatus: ({ operationNumber }) => (operationNumber.trim() ? 'en_verificacion' : 'pendiente'),
  autoConfirms: false,
}

export const paymentMethods: PaymentMethod[] = ['yape', 'plin', 'transferencia']

/** Datos de pago visibles para un método; vacío si aún no están configurados. */
export function paymentDetails(method: PaymentMethod, s: PublicSettings): [string, string][] {
  const rows: [string, string | null][] =
    method === 'transferencia'
      ? [
          ['Banco', s.payment_transfer.bank],
          ['Titular', s.payment_transfer.holder],
          ['Cuenta', s.payment_transfer.account],
          ['CCI', s.payment_transfer.cci],
        ]
      : (() => {
          const w = method === 'yape' ? s.payment_yape : s.payment_plin
          return [
            ['Número', w.number],
            ['Titular', w.holder],
          ]
        })()
  return rows.filter((r): r is [string, string] => Boolean(r[1]))
}
