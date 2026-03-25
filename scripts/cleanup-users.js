// Скрипт для удаления тестовых пользователей из Firebase
// Запуск: node scripts/cleanup-users.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsNDybKXZNbCuHGl7_vXwh6YnIhGdH7Yk",
  authDomain: "v-message-83866.firebaseapp.com",
  projectId: "v-message-83866",
  storageBucket: "v-message-83866.firebasestorage.app",
  messagingSenderId: "631499278712",
  appId: "1:631499278712:web:739c30d5c4b8dcd386608d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function cleanupUsers() {
  console.log("🔍 Получение списка пользователей...");

  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);

  console.log(`📊 Всего пользователей: ${snapshot.size}`);

  let deleted = 0;
  let skipped = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const username = data.username;
    const uid = data.uid;
    
    try {
      // Удаляем из Firestore
      await deleteDoc(doc(db, "users", uid));
      console.log(`🗑️ Удалён: @${username} (${uid})`);
      deleted++;
    } catch (err) {
      console.error(`❌ Ошибка удаления @${username}:`, err.message);
    }
  }
  
  console.log("\n✅ Готово!");
  console.log(`🗑️ Удалено: ${deleted}`);
  console.log(`✓ Пропущено: ${skipped}`);
  
  process.exit(0);
}

cleanupUsers().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
