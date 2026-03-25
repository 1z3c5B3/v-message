import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCaUuWwsLkIDvoDJMg3qHQnzLD0HLfTAZ4",
  authDomain: "v-message-83866.firebaseapp.com",
  projectId: "v-message-83866",
  storageBucket: "v-message-83866.firebasestorage.app",
  messagingSenderId: "631499278712",
  appId: "1:631499278712:web:739c30d5c4b8dcd386608d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { app };
export default app;
