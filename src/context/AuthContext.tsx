import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  User,
  updatePassword as fbUpdatePassword,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  avatar: string;
  online: boolean;
  bio?: string;
  blockedUsers?: string[];
  archivedChats?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (username: string, password: string, avatar?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, "username" | "avatar" | "bio">>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  searchUser: (username: string) => Promise<UserProfile | null>;
  togglePinChat: (chatId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  archiveChat: (chatId: string) => Promise<void>;
  unarchiveChat: (chatId: string) => Promise<void>;
  isArchived: (chatId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const toEmail = (username: string) =>
  `${username.toLowerCase().replace(/[^a-z0-9]/g, "_")}@vmsg.app`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setProfile(snap.data() as UserProfile);
        await updateDoc(doc(db, "users", u.uid), { online: true, lastSeen: serverTimestamp() }).catch(() => {});
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (username: string, password: string, avatar = "😊") => {
    const email = toEmail(username);
    
    // Проверяем, существует ли уже пользователь с таким username
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw { code: "auth/username-already-in-use" };
    }
    
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData: UserProfile = {
      uid: cred.user.uid,
      username,
      avatar,
      online: true,
    };
    await setDoc(doc(db, "users", cred.user.uid), {
      ...profileData,
      contacts: [],
      lastSeen: serverTimestamp(),
    });
    setProfile(profileData);
  };

  const login = async (username: string, password: string) => {
    const email = toEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profileData: UserProfile = {
      uid: cred.user.uid,
      username: cred.user.displayName || cred.user.email?.split("@")[0] || "User",
      avatar: "😊",
      online: true,
    };
    const docSnap = await getDoc(doc(db, "users", cred.user.uid));
    if (!docSnap.exists()) {
      await setDoc(doc(db, "users", cred.user.uid), {
        ...profileData,
        contacts: [],
        lastSeen: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, "users", cred.user.uid), { online: true, lastSeen: serverTimestamp() });
    }
    setProfile(profileData);
  };

  const logout = async () => {
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { online: false, lastSeen: serverTimestamp() }).catch(() => {});
    }
    await auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Pick<UserProfile, "username" | "avatar">>) => {
    if (!user || !profile) return;
    
    // Если меняем username, проверяем на уникальность
    if (data.username && data.username !== profile.username) {
      const q = query(collection(db, "users"), where("username", "==", data.username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error("Это имя уже занято");
      }
    }
    
    await updateDoc(doc(db, "users", user.uid), data);
    setProfile((p) => (p ? { ...p, ...data } : p));
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;
    await fbUpdatePassword(user, newPassword);
  };

  const deleteAccount = async (password: string) => {
    if (!user) return;
    
    // Сначала удаляем данные из Firestore
    await deleteDoc(doc(db, "users", user.uid));
    
    // Для email/password пользователей нужна перенаутентификация
    if (user.providerData.some(p => p.providerId === "password")) {
      const email = user.email;
      if (email) {
        await signInWithEmailAndPassword(auth, email, password);
      }
    }
    
    await deleteUser(user);
    setProfile(null);
  };

  const searchUser = async (username: string): Promise<UserProfile | null> => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return doc.data() as UserProfile;
  };

  const togglePinChat = async (chatId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const pinnedChats = userSnap.data()?.pinnedChats || [];
    const newPinned = pinnedChats.includes(chatId)
      ? pinnedChats.filter((id: string) => id !== chatId)
      : [...pinnedChats, chatId];
    await updateDoc(userRef, { pinnedChats: newPinned });
  };

  const blockUser = async (userId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const blocked = userSnap.data()?.blockedUsers || [];
    if (!blocked.includes(userId)) {
      await updateDoc(userRef, { blockedUsers: [...blocked, userId] });
    }
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const blocked = userSnap.data()?.blockedUsers || [];
    await updateDoc(userRef, { blockedUsers: blocked.filter((id: string) => id !== userId) });
  };

  const isBlocked = (userId: string): boolean => {
    if (!profile) return false;
    return (profile.blockedUsers || []).includes(userId);
  };

  const archiveChat = async (chatId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const archived = userSnap.data()?.archivedChats || [];
    if (!archived.includes(chatId)) {
      await updateDoc(userRef, { archivedChats: [...archived, chatId] });
    }
  };

  const unarchiveChat = async (chatId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const archived = userSnap.data()?.archivedChats || [];
    await updateDoc(userRef, { archivedChats: archived.filter((id: string) => id !== chatId) });
  };

  const isArchived = (chatId: string): boolean => {
    if (!profile) return false;
    return (profile.archivedChats || []).includes(chatId);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, signInWithGoogle, logout, updateProfile, changePassword, deleteAccount, searchUser, togglePinChat, blockUser, unblockUser, isBlocked, archiveChat, unarchiveChat, isArchived }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
