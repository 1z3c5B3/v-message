import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  doc, setDoc, deleteDoc, getDoc, updateDoc, arrayRemove,
} from "firebase/firestore";
import StickerPicker from "@/components/StickerPicker";
import { Group } from "@/pages/GroupCreate";

interface Message {
  id: string;
  text: string;
  type: "text" | "sticker";
  uid: string;
  username: string;
  userAvatar: string;
  createdAt: any;
}

interface Props {
  group: Group;
  onBack: () => void;
}

export default function GroupChat({ group, onBack }: Props) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [memberCount, setMemberCount] = useState(group.members.length);
  const [showInfo, setShowInfo] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { username: string; avatar: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  const isAdmin = user ? group.admins.includes(user.uid) : false;
  const canPost = group.type === "group" || isAdmin;

  useEffect(() => {
    const q = query(collection(db, "groups", group.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }, [group.id]);

  useEffect(() => {
    return onSnapshot(doc(db, "groups", group.id), (snap) => {
      if (snap.exists()) setMemberCount(snap.data()?.members?.length || 0);
    });
  }, [group.id]);

  useEffect(() => {
    const loadMembers = async () => {
      const profiles: Record<string, { username: string; avatar: string }> = {};
      for (const uid of group.members) {
        const s = await getDoc(doc(db, "users", uid));
        if (s.exists()) {
          const d = s.data();
          profiles[uid] = { username: d.username, avatar: d.avatar };
        }
      }
      setMemberProfiles(profiles);
    };
    loadMembers();
  }, [group.members]);

  const send = async (msgText: string, type: "text" | "sticker" = "text") => {
    if (!user || !profile || !msgText.trim()) return;
    await addDoc(collection(db, "groups", group.id, "messages"), {
      text: msgText, type, uid: user.uid,
      username: profile.username, userAvatar: profile.avatar,
      createdAt: serverTimestamp(),
    });
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    await send(text.trim());
    setText("");
    setShowStickers(false);
  };

  const leaveGroup = async () => {
    if (!user) return;
    await updateDoc(doc(db, "groups", group.id), { members: arrayRemove(user.uid) });
    onBack();
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const groups: { date: string; msgs: Message[] }[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = m.createdAt?.toDate?.() || new Date();
    const ds = d.toLocaleDateString("ru", { day: "numeric", month: "long" });
    if (ds !== lastDate) { groups.push({ date: ds, msgs: [] }); lastDate = ds; }
    groups[groups.length - 1].msgs.push(m);
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button className="btn-back" onClick={onBack}>←</button>
        <div className="chat-header-info" onClick={() => setShowInfo(!showInfo)} style={{ cursor: "pointer" }}>
          <span className="chat-header-avatar">{group.avatar}</span>
          <div>
            <div className="chat-header-name">{group.name}</div>
            <div className="chat-header-status">
              {group.type === "group" ? `👥 ${memberCount} участников` : `📢 ${memberCount} подписчиков`}
            </div>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="group-info-panel">
          <div className="group-info-title">Участники ({memberCount})</div>
          {Object.entries(memberProfiles).map(([uid, p]) => (
            <div key={uid} className="group-member-row">
              <span className="group-member-avatar">{p.avatar}</span>
              <span className="group-member-name">{p.username}</span>
              {group.admins.includes(uid) && <span className="admin-badge">Админ</span>}
              {uid === user?.uid && <span className="you-badge">Вы</span>}
            </div>
          ))}
          <button className="leave-btn" onClick={leaveGroup}>
            {group.type === "group" ? "Покинуть группу" : "Отписаться"}
          </button>
        </div>
      )}

      <div className="messages-area" onClick={() => setShowStickers(false)}>
        {groups.map(({ date, msgs }) => (
          <div key={date}>
            <div className="date-divider"><span>{date}</span></div>
            {msgs.map((m) => {
              const mine = m.uid === user?.uid;
              if (m.type === "sticker") {
                return (
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
                    {!mine && <span className="msg-avatar">{m.userAvatar || "😊"}</span>}
                    <div className="msg-sticker">
                      {!mine && <span className="msg-sender">{m.username}</span>}
                      <span className="sticker-big">{m.text}</span>
                      <span className="sticker-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
                  {!mine && <span className="msg-avatar">{m.userAvatar || "😊"}</span>}
                  <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                    {!mine && <span className="msg-sender">{m.username}</span>}
                    <span className="msg-text">{m.text}</span>
                    <span className="msg-time">{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showStickers && canPost && (
        <StickerPicker onSend={(s) => send(s, "sticker")} onClose={() => setShowStickers(false)} />
      )}

      {canPost ? (
        <form className="chat-input-bar" onSubmit={sendText}>
          <button type="button" className="btn-sticker"
            onClick={(e) => { e.stopPropagation(); setShowStickers(!showStickers); }}>🙂</button>
          <input type="text" className="chat-input" placeholder="Сообщение..."
            value={text} onChange={(e) => setText(e.target.value)}
            onFocus={() => setShowStickers(false)} />
          <button type="submit" className="btn-send" disabled={!text.trim()}>➤</button>
        </form>
      ) : (
        <div className="channel-readonly">
          <span>📢 Только администраторы могут писать</span>
        </div>
      )}
    </div>
  );
}
