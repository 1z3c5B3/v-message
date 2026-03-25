import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const AVATARS = ["👥","🎮","📢","🌟","🔥","💎","🎸","🚀","🌈","⚽","🎭","🎨","🏆","🌺","🦁","🐉","🎯","🎪","🌙","💫"];

export interface Group {
  id: string;
  type: "group" | "channel";
  name: string;
  avatar: string;
  creator: string;
  members: string[];
  admins: string[];
  createdAt: any;
}

interface Props {
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export default function GroupCreate({ onClose, onCreated }: Props) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<"group" | "channel">("group");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👥");
  const [showAvatars, setShowAvatars] = useState(false);
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, [user]);

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });
  };

  const create = async () => {
    if (!name.trim()) { setError("Введи название"); return; }
    if (!user || !profile) return;
    setLoading(true);
    setError("");
    try {
      const members = [user.uid, ...Array.from(selected)];
      const ref = await addDoc(collection(db, "groups"), {
        type,
        name: name.trim(),
        avatar,
        creator: user.uid,
        members,
        admins: [user.uid],
        createdAt: serverTimestamp(),
      });
      const group: Group = {
        id: ref.id, type, name: name.trim(), avatar,
        creator: user.uid, members, admins: [user.uid], createdAt: null,
      };
      onCreated(group);
    } catch { setError("Ошибка при создании"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {step === "type" ? (
          <>
            <div className="modal-header">
              <h3>Новый чат</h3>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="type-choice">
              <button className="type-btn" onClick={() => { setType("group"); setAvatar("👥"); setStep("form"); }}>
                <span className="type-icon">👥</span>
                <div>
                  <div className="type-title">Группа</div>
                  <div className="type-desc">Все участники могут писать</div>
                </div>
              </button>
              <button className="type-btn" onClick={() => { setType("channel"); setAvatar("📢"); setStep("form"); }}>
                <span className="type-icon">📢</span>
                <div>
                  <div className="type-title">Канал</div>
                  <div className="type-desc">Только вы пишете, остальные читают</div>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <button className="modal-back" onClick={() => setStep("type")}>←</button>
              <h3>Новый {type === "group" ? "группа" : "канал"}</h3>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="gc-avatar-row">
              <button className="gc-avatar-btn" onClick={() => setShowAvatars(!showAvatars)}>
                <span className="gc-avatar">{avatar}</span>
              </button>
              <input type="text" className="gc-name-input" placeholder={type === "group" ? "Название группы" : "Название канала"}
                value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>

            {showAvatars && (
              <div className="avatar-grid" style={{ margin: "0 0 12px" }}>
                {AVATARS.map((a) => (
                  <button key={a} className={`avatar-opt ${avatar === a ? "selected" : ""}`}
                    onClick={() => { setAvatar(a); setShowAvatars(false); }}>
                    {a}
                  </button>
                ))}
              </div>
            )}

            {contacts.length > 0 && (
              <>
                <p className="gc-section-label">
                  {type === "group" ? "Добавить участников" : "Добавить подписчиков"} (необязательно)
                </p>
                <div className="gc-contacts">
                  {contacts.map((c) => (
                    <div key={c.uid} className={`gc-contact-row ${selected.has(c.uid) ? "selected" : ""}`}
                      onClick={() => toggleSelect(c.uid)}>
                      <span className="gc-contact-avatar">{c.avatar}</span>
                      <span className="gc-contact-name">{c.username}</span>
                      <span className={`gc-check ${selected.has(c.uid) ? "on" : ""}`}>
                        {selected.has(c.uid) ? "✓" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && <p className="auth-error">{error}</p>}
            <button className="gc-create-btn" onClick={create} disabled={loading || !name.trim()}>
              {loading ? <span className="spinner" /> : `Создать ${type === "group" ? "группу" : "канал"}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
