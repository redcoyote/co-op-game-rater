import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

// Конфіг читається з .env (префікс VITE_ обов'язковий — інакше Vite не віддасть
// змінну в клієнтський бандл). Див. .env.example для списку потрібних змінних.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Швидка перевірка в dev-режимі: якщо хтось забув створити .env — одразу видно.
if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.error(
    '[firebase] VITE_FIREBASE_* env vars не знайдено. Скопіюй .env.example → .env'
  )
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

export const db = getFirestore(app)
export const auth = getAuth(app)

// Переконується, що у нас є залогінений Firebase-юзер.
// Якщо є — повертає його одразу. Якщо нема — робить анонімний логін.
export async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser
  const cred = await signInAnonymously(auth)
  return cred.user
}
