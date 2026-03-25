import { useState } from "react";
import { AuthProvider, useAuth, UserProfile } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Login from "@/pages/Login";
import ChatList from "@/pages/ChatList";
import Chat from "@/pages/Chat";
import GroupChat from "@/pages/GroupChat";
import Contacts from "@/pages/Contacts";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import { Group } from "@/pages/GroupCreate";

type Tab = "chats" | "contacts" | "settings" | "about";
type Page =
  | { type: "main"; tab: Tab }
  | { type: "chat"; contact: UserProfile }
  | { type: "group"; group: Group };

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>({ type: "main", tab: "chats" });

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-icon">💬</div>
        <p className="splash-name">V-Message</p>
        <div className="spinner-lg" />
      </div>
    );
  }

  if (!user) return <Login />;

  const openChat = (contact: UserProfile) => setPage({ type: "chat", contact });
  const openGroup = (group: Group) => setPage({ type: "group", group });
  const goBack = () => setPage({ type: "main", tab: "chats" });

  if (page.type === "chat") {
    return <Chat contact={page.contact} onBack={goBack} />;
  }
  if (page.type === "group") {
    return <GroupChat group={page.group} onBack={goBack} />;
  }

  const tab = page.tab;
  const setTab = (t: Tab) => setPage({ type: "main", tab: t });

  return (
    <div className="app-layout">
      <div className="main-content">
        {tab === "chats" && <ChatList onOpenChat={openChat} onOpenGroup={openGroup} />}
        {tab === "contacts" && <Contacts onOpenChat={openChat} />}
        {tab === "settings" && <Settings />}
        {tab === "about" && <About />}
      </div>
      <nav className="bottom-nav">
        <button className={`nav-btn ${tab === "chats" ? "active" : ""}`} onClick={() => setTab("chats")}>
          <span className="nav-icon">💬</span>
          <span className="nav-label">Чаты</span>
        </button>
        <button className={`nav-btn ${tab === "contacts" ? "active" : ""}`} onClick={() => setTab("contacts")}>
          <span className="nav-icon">👥</span>
          <span className="nav-label">Контакты</span>
        </button>
        <button className={`nav-btn ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Настройки</span>
        </button>
        <button className={`nav-btn ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
          <span className="nav-icon">ℹ️</span>
          <span className="nav-label">О приложении</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppInner />
      </NotificationProvider>
    </AuthProvider>
  );
}
