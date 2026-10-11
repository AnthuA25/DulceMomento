// Crea (o actualiza) el usuario administrador en Supabase Auth.
//
//   npm run admin:create -- admin@tu-dominio.com
//
// La contraseña se escribe en la terminal y no se guarda en ningún archivo:
// Supabase Auth la almacena como hash. Requiere SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY en .env.local (archivo ignorado por git).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z_]+)=(.*)$/.exec(line.trim())
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch { /* opcional */ }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = (process.argv[2] || '').toLowerCase()

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Uso: npm run admin:create -- admin@tu-dominio.com')
  process.exit(1)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const password = process.env.ADMIN_INITIAL_PASSWORD || (await rl.question('Contraseña inicial (mínimo 8 caracteres): '))
rl.close()
if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

let userId
const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
if (created.error) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = data?.users.find((u) => u.email?.toLowerCase() === email)
  if (!existing) {
    console.error('No se pudo crear el usuario:', created.error.message)
    process.exit(1)
  }
  userId = existing.id
  const updated = await supabase.auth.admin.updateUserById(userId, { password })
  if (updated.error) {
    console.error('No se pudo actualizar la contraseña:', updated.error.message)
    process.exit(1)
  }
  console.log('El usuario ya existía: se actualizó su contraseña.')
} else {
  userId = created.data.user.id
}

const { error } = await supabase.from('admin_profiles').upsert({ user_id: userId, display_name: 'Administrador' })
if (error) {
  console.error('No se pudo registrar el perfil de administrador:', error.message)
  process.exit(1)
}
console.log(`Administrador listo: ${email}`)
console.log('Cambia la contraseña desde /admin/configuracion después del primer ingreso.')
