import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getAnalytics } from "firebase/analytics";
// ─────────────────────────────────────────────────────────────────────────────
// КРОКИ ДЛЯ НАЛАШТУВАННЯ:
//
// 1. Йди на https://console.firebase.google.com
// 2. Створи новий проект (або відкрий існуючий)
// 3. Project Settings → General → Your apps → Add app → Web (</>)
// 4. Скопіюй firebaseConfig нижче і заміни значення
//
// 5. Увімкни Anonymous Auth:
//    Authentication → Sign-in method → Anonymous → Enable
//
// 6. Створи Firestore базу:
//    Firestore Database → Create database → Start in test mode
//    (після цього налаштуй rules — дивись нижче)
//
// FIRESTORE RULES (скопіюй у Firestore → Rules):
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /sessions/{sessionId} {
//          allow read, write: if request.auth != null;
//          match /scores/{nickname} {
//            allow read: if request.auth != null;
//            allow write: if request.auth != null;
//          }
//        }
//      }
//    }
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDzd3p2ZC0ismQdUzUivhlmnPXAru6XlxQ",
  authDomain: "co-op-game-rater.firebaseapp.com",
  projectId: "co-op-game-rater",
  storageBucket: "co-op-game-rater.firebasestorage.app",
  messagingSenderId: "306229239130",
  appId: "1:306229239130:web:4162b3553b507b9edfe763",
  measurementId: "G-7CMJPP2XZS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app)
export const auth = getAuth(app)

// Функція для анонімного входу — викликається при першому запуску
export async function signInAnon() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user)
      } else {
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user))
          .catch(reject)
      }
    })
  })
}
