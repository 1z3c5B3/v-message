import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import {
  collection, doc, getDoc, onSnapshot, orderBy, query, where, limit, getDocs
} from "firebase/firestore";
import GroupCreate, { Group } from "@/pages/GroupCreate";

interface DmItem {
  kind: "dm";
  id: string;
  contact: UserProfile;
  lastMessage: string;
  lastTime: any;
  pinned?: boolean;
  unreadCount?: number;
}

interface GroupItem {
  kind: "group";
  group: Group;
  lastMessage: string;
  lastTime: any;
  pinned?: boolean;
  unreadCount?: number;
}

type ListItem = DmItem | GroupItem;

interface Props {
  onOpenChat: (contact: UserProfile) => void;
  onOpenGroup: (group: Group) => void;
}

export default function ChatList({ onOpenChat, onOpenGroup }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!user) return;

    let contactUids: string[] = [];
    let pinnedChats: string[] = [];
    let groups: Group[] = [];
    let loadedContacts = false;
    let loadedGroups = false;

    const refresh = () => {
      if (!loadedContacts || !loadedGroups) return;

      const results: ListItem[] = [];

      // DM conversations
      contactUids.forEach(async (contactUid) => {
        const contactSnap = await getDoc(doc(db, "users", contactUid));
        if (!contactSnap.exists()) return;
        const contact = contactSnap.data() as UserProfile;
        const convoId = [user.uid, contactUid].sort().join("_");
        const msgsRef = collection(db, "conversations", convoId, "messages");
        const q = query(msgsRef, orderBy("createdAt", "desc"), limit(1));
        const msgsSnap = await getDocs(q);
        const lastMsg = msgsSnap.docs[0]?.data();
        results.push({
          kind: "dm", id: convoId, contact,
          lastMessage: lastMsg ? (lastMsg.type === "sticker" ? lastMsg.text + " (стикер)" : lastMsg.text) : "Нажми чтобы написать",
          lastTime: lastMsg?.createdAt,
          pinned: pinnedChats.includes(convoId),
        });
      });

      // Groups/Channels
      groups.forEach(async (group) => {
        const msgsRef = collection(db, "groups", group.id, "messages");
        const q = query(msgsRef, orderBy("createdAt", "desc"), limit(1));
        const msgsSnap = await getDocs(q);
        const lastMsg = msgsSnap.docs[0]?.data();
        results.push({
          kind: "group", group,
          lastMessage: lastMsg
            ? `${lastMsg.username}: ${lastMsg.type === "sticker" ? lastMsg.text + " (стикер)" : lastMsg.text}`
            : "Нет сообщений",
          lastTime: lastMsg?.createdAt,
          pinned: pinnedChats.includes(`group_${group.id}`),
        });
      });

      // Закреплённые сверху
      results.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const ta = a.lastTime?.toMillis?.() || 0;
        const tb = b.lastTime?.toMillis?.() || 0;
        return tb - ta;
      });
      setItems(results);
      setLoading(false);
    };

    // Watch user contacts
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      contactUids = snap.data()?.contacts || [];
      pinnedChats = snap.data()?.pinnedChats || [];
      loadedContacts = true;
      refresh();
    });

    // Watch groups where user is a member
    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const unsubGroups = onSnapshot(groupsQuery, (snap) => {
      groups = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
      loadedGroups = true;
      refresh();
    });

    return () => { unsubUser(); unsubGroups(); };
  }, [user]);

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate?.() || new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Сейчас";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner-lg" /></div>;
  }

  return (
    <div className="chatlist-page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2>Сообщения</h2>
        <button className="btn-new-chat" onClick={() => setShowCreate(true)} title="Новая группа / канал">✏️</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Нет чатов</p>
          <p className="empty-sub">Добавь контакты во вкладке «Контакты»<br />или создай группу / канал</p>
        </div>
      ) : (
        <div className="chat-list">
          {items.map((item) => {
            if (item.kind === "dm") {
              return (
                <div
                  key={item.id}
                  className="chat-list-item"
                  onClick={() => onOpenChat(item.contact)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Закрепить/открепить можно через долгое нажатие
                  }}
                >
                  <div className="chat-list-avatar">{item.contact.avatar}</div>
                  <div className="chat-list-info">
                    <div className="chat-list-row">
                      <span className="chat-list-name">
                        {item.pinned && <span className="pin-indicator">📌</span>}
                        {item.contact.username}
                      </span>
                      <span className="chat-list-time">{formatTime(item.lastTime)}</span>
                    </div>
                    <div className="chat-list-row">
                      <span className="chat-list-preview">{item.lastMessage}</span>
                      {item.contact.online && <span className="online-badge">●</span>}
                    </div>
                    {item.unreadCount > 0 && (
                      <div className="unread-badge">{item.unreadCount}</div>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div key={item.group.id} className="chat-list-item" onClick={() => onOpenGroup(item.group)}>
                <div className="chat-list-avatar">{item.group.avatar}</div>
                <div className="chat-list-info">
                  <div className="chat-list-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="chat-list-name">{item.group.name}</span>
                      <span className="group-type-badge">{item.group.type === "group" ? "👥" : "📢"}</span>
                    </div>
                    <span className="chat-list-time">{formatTime(item.lastTime)}</span>
                  </div>
                  <div className="chat-list-row">
                    <span className="chat-list-preview">{item.lastMessage}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <GroupCreate
          onClose={() => setShowCreate(false)}
          onCreated={(group) => { setShowCreate(false); onOpenGroup(group); }}
        />
      )}
    </div>
  );
}
