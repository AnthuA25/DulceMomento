import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const isFirebaseConfigured = Object.values(config).every(Boolean)
const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null
export const auth = app ? getAuth(app) : null
export const firestore = app ? getFirestore(app) : null

export const BACKEND_MISSING =
  'Firebase aún no está configurado. Escríbenos por WhatsApp mientras lo activamos.'

export function requireFirestore() {
  if (!firestore) throw new Error(BACKEND_MISSING)
  return firestore
}
