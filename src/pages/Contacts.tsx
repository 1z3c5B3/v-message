import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import {
  collection, doc, updateDoc, arrayUnion, getDoc, arrayRemove, getDocs
} from "firebase/firestore";

interface Props {
  onOpenChat: (contact: UserProfile) => void;
}

export default function Contacts({ onOpenChat }: Props) {
  const { user, profile } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<UserProfile | null | "none" | "self">(null);
  const [searching, setSearching] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const uids: string[] = snap.data()?.contacts || [];
      const profiles: UserProfile[] = [];
      for (const uid of uids) {
        const s = await getDoc(doc(db, "users", uid));
        if (s.exists()) profiles.push(s.data() as UserProfile);
      }
      setContacts(profiles);
    };
    loadContacts();
  }, [user, addMsg]);

  const doSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchResult(null);
    try {
      // Проверка на самого себя (case-insensitive)
      if (profile?.username.toLowerCase() === q.toLowerCase()) {
        setSearchResult("self");
        setSearching(false);
        return;
      }

      // Поиск по базе с case-insensitive сравнением
      const usersRef = collection(db, "users");
      const allUsers = await getDocs(usersRef);
      const found = allUsers.docs.find(doc =>
        doc.data().username?.toLowerCase() === q.toLowerCase()
      );
      
      setSearchResult(found ? (found.data() as UserProfile) : "none");
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult("none");
    } finally {
      setSearching(false);
    }
  };

  const addContact = async (contact: UserProfile) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { contacts: arrayUnion(contact.uid) });
    setAddMsg("ok");
    setSearch("");
    setSearchResult(null);
  };

  const removeContact = async (uid: string) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { contacts: arrayRemove(uid) });
    setContacts((prev) => prev.filter((c) => c.uid !== uid));
  };

  const isAlready = (uid: string) => contacts.some((c) => c.uid === uid);

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h2>Контакты</h2>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Найти по имени пользователя..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          className="search-input"
        />
        <button className="search-btn" onClick={doSearch} disabled={searching || !search.trim()}>
          {searching ? <span className="spinner-sm" /> : "🔍"}
        </button>
      </div>

      {searchResult && (
        <div className="search-result-box">
          {searchResult === "none" && <p className="search-none">Пользователь не найден</p>}
          {searchResult === "self" && <p className="search-none">Это ваш аккаунт</p>}
          {typeof searchResult === "object" && (
            <div className="search-user">
              <span className="search-user-avatar">{searchResult.avatar}</span>
              <div className="search-user-info">
                <span className="search-user-name">{searchResult.username}</span>
                {searchResult.online && <span className="online-text">онлайн</span>}
              </div>
              {isAlready(searchResult.uid) ? (
                <span className="already-added">✓ Добавлен</span>
              ) : (
                <button className="btn-add-contact" onClick={() => addContact(searchResult as UserProfile)}>
                  Добавить
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Контактов нет</p>
            <p className="empty-sub">Найди друга по имени выше</p>
          </div>
        ) : (
          contacts.map((c) => (
            <div key={c.uid} className="contact-item">
              <div className="contact-avatar">{c.avatar}</div>
              <div className="contact-info" onClick={() => onOpenChat(c)}>
                <span className="contact-name">{c.username}</span>
                {c.online && <span className="online-text">онлайн</span>}
              </div>
              <div className="contact-actions">
                <button className="btn-msg" onClick={() => onOpenChat(c)} title="Написать">💬</button>
                <button className="btn-remove" onClick={() => removeContact(c.uid)} title="Удалить">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
