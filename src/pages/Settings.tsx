import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme, themes } from "@/lib/theme";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

const AVATARS = ["😊","😎","🤩","🥳","🐶","🐱","🦊","🐼","🐨","🦁","🌸","⚡","🔥","🌈","💎","🎮","🎸","🚀","👾","🍕","🦄","🐉","🌺","🎯","🏆","🎭","🎨","🌙","☀️","❤️"];
const ADMIN_PASSWORD = "vgd3303vgd";
const APP_VERSION = "2.4.0";

export default function Settings() {
  const { profile, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const { notificationPermission, isSubscribed, requestPermission, revokePermission } = useNotification();
  const { currentTheme, setTheme } = useTheme();
  const [quietHours, setQuietHours] = useState(false);
  const [quietStart] = useState(22);
  const [quietEnd] = useState(8);
  const [avatar, setAvatar] = useState(profile?.avatar || "😊");
  const [showAvatars, setShowAvatars] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || "");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  
  // Admin ban panel
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showBanPanel, setShowBanPanel] = useState(false);
  const [banLoading, setBanLoading] = useState(false);

  const saveAvatar = async (a: string) => {
    setAvatar(a);
    setShowAvatars(false);
    setSaving(true);
    try {
      await updateProfile({ avatar: a });
    } catch (e: any) {
      setUsernameMsg(e?.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) { setUsernameMsg("Минимум 2 символа"); return; }
    if (trimmed === profile?.username) { setUsernameMsg(""); return; }
    
    setSaving(true);
    setUsernameMsg("");
    try {
      await updateProfile({ username: trimmed });
      setUsernameMsg("✓ Имя изменено");
    } catch (err: any) {
      setUsernameMsg(err?.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassMsg("Минимум 6 символов"); return; }
    if (newPass !== confirmPass) { setPassMsg("Пароли не совпадают"); return; }
    setSavingPass(true);
    setPassMsg("");
    try {
      await changePassword(newPass);
      setPassMsg("✓ Пароль изменён");
      setNewPass("");
      setConfirmPass("");
    } catch {
      setPassMsg("Ошибка. Войди заново и попробуй снова.");
    } finally { setSavingPass(false); }
  };

  const handleDeleteAccount = async () => {
    if (deletePassword.length < 6) { setUsernameMsg("Введите пароль"); return; }
    if (deleteConfirm !== profile?.username) { setUsernameMsg("Имя не совпадает"); return; }

    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setUsernameMsg(err?.message || "Ошибка удаления");
    }
  };

  const handleVersionClick = () => {
    if (isAdminVerified) {
      setShowBanPanel(!showBanPanel);
    } else {
      setShowAdminPassword(true);
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminVerified(true);
      setShowAdminPassword(false);
      setAdminPasswordInput("");
      setShowBanPanel(true);
      await loadUsers();
    } else {
      alert("Неверный пароль!");
      setAdminPasswordInput("");
    }
  };

  const loadUsers = async () => {
    setBanLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      alert("Не удалось загрузить пользователей");
    }
    setBanLoading(false);
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Заблокировать пользователя ${username}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), {
        banned: true,
        bannedAt: new Date().toISOString()
      });
      alert(`Пользователь ${username} заблокирован`);
      await loadUsers();
    } catch (error) {
      console.error("Ошибка бана:", error);
      alert("Ошибка при блокировке");
    }
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!confirm(`Разблокировать пользователя ${username}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), {
        banned: false,
        bannedAt: null
      });
      alert(`Пользователь ${username} разблокирован`);
      await loadUsers();
    } catch (error) {
      console.error("Ошибка разблокировки:", error);
      alert("Ошибка при разблокировке");
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminVerified(false);
    setShowBanPanel(false);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Настройки</h2>
      </div>

      <div className="settings-profile-card">
        <button className="settings-avatar-btn" onClick={() => setShowAvatars(!showAvatars)}>
          <span className="settings-avatar">{avatar}</span>
          <span className="settings-avatar-label">Сменить</span>
        </button>
        {showAvatars && (
          <div className="avatar-grid-big">
            {AVATARS.map((a) => (
              <button key={a} className={`avatar-opt ${avatar === a ? "selected" : ""}`}
                onClick={() => saveAvatar(a)}>
                {a}
              </button>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSaveUsername} className="settings-username-form">
          <div className="settings-username">
            <span className="settings-name-label">Имя пользователя</span>
            <input 
              type="text" 
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="settings-username-input"
              maxLength={20}
            />
          </div>
          <button type="submit" className="settings-btn-save" disabled={saving || newUsername.trim() === profile?.username}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </form>
        {usernameMsg && <p className={`save-msg ${usernameMsg.startsWith("✓") ? "ok" : "err"}`}>{usernameMsg}</p>}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Сменить пароль</h3>
        <form onSubmit={handleChangePassword} className="settings-form">
          <input type="password" placeholder="Новый пароль" value={newPass}
            onChange={(e) => setNewPass(e.target.value)} className="settings-input" />
          <input type="password" placeholder="Повтори пароль" value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)} className="settings-input" />
          {passMsg && <p className={`pass-msg ${passMsg.startsWith("✓") ? "ok" : "err"}`}>{passMsg}</p>}
          <button type="submit" className="settings-btn-save" disabled={savingPass}>
            {savingPass ? "Сохраняем..." : "Изменить пароль"}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Удалить аккаунт</h3>
        {!deleteMode ? (
          <button className="settings-btn-delete" onClick={() => setDeleteMode(true)}>
            ⚠️ Удалить аккаунт
          </button>
        ) : (
          <div className="delete-confirm-form">
            <p className="delete-warning">Это действие нельзя отменить! Все данные будут удалены.</p>
            <input 
              type="password" 
              placeholder="Введите пароль" 
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="settings-input"
            />
            <input 
              type="text" 
              placeholder={`Введите @${profile?.username} для подтверждения`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="settings-input"
            />
            <div className="delete-buttons">
              <button className="settings-btn-cancel" onClick={() => { setDeleteMode(false); setDeletePassword(""); setDeleteConfirm(""); }}>
                Отмена
              </button>
              <button className="settings-btn-delete-confirm" onClick={handleDeleteAccount}>
                Удалить навсегда
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Уведомления</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
            {isSubscribed
              ? '✅ Push-уведомления включены (OneSignal)'
              : notificationPermission === 'denied'
              ? '❌ Push-уведомления заблокированы'
              : '⏳ Push-уведомления не настроены'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>
            💡 Уведомления работают даже когда сайт закрыт
          </p>
          {!isSubscribed && notificationPermission !== 'denied' ? (
            <button className="settings-btn-save" onClick={requestPermission}>
              🔔 Включить уведомления
            </button>
          ) : isSubscribed ? (
            <button className="settings-btn-logout" onClick={revokePermission}>
              🔕 Отключить уведомления
            </button>
          ) : null}
          {notificationPermission === 'denied' && (
            <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0 }}>
              Разрешите уведомления в настройках браузера
            </p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Внешний вид</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              onClick={() => setTheme(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: currentTheme === key ? 'var(--accent-light)' : 'var(--bg3)',
                border: currentTheme === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: currentTheme === key ? 600 : 400 }}>
                {key === 'default' && '🌑 '}
                {key === 'light' && '☀️ '}
                {key === 'blue' && '🌊 '}
                {key === 'green' && '🌲 '}
                {key === 'red' && '🔴 '}
                {theme.name}
              </span>
              {currentTheme === key && (
                <span style={{ color: 'var(--accent)', fontSize: '18px' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Уведомления</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px' }}>🌙 Тихие часы (22:00 - 08:00)</span>
            <button
              onClick={() => setQuietHours(!quietHours)}
              style={{
                padding: '8px 16px',
                background: quietHours ? 'var(--accent)' : 'var(--surface2)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {quietHours ? 'Вкл' : 'Выкл'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>
            💡 В тихие часы уведомления не будут издавать звук
          </p>
        </div>
      </div>

      <div className="settings-section">
        <button className="settings-btn-logout" onClick={logout}>
          Выйти из аккаунта
        </button>
      </div>

      <div className="settings-section" style={{ textAlign: 'center', marginTop: '20px' }}>
        <p 
          onClick={handleVersionClick}
          style={{ 
            fontSize: '13px', 
            color: 'var(--text3)', 
            cursor: 'pointer',
            margin: 0
          }}
        >
          V-Message v{APP_VERSION} {isAdminVerified && '👑'}
        </p>
      </div>

      {/* Modal для ввода пароля админа */}
      {showAdminPassword && (
        <div className="admin-modal-overlay" onClick={() => setShowAdminPassword(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">🔐 Вход для администратора</h3>
            <form onSubmit={handleAdminPasswordSubmit}>
              <input
                type="password"
                placeholder="Введите пароль"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="settings-input"
                autoFocus
                style={{ marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="settings-btn-cancel" onClick={() => setShowAdminPassword(false)} style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="settings-btn-save" style={{ flex: 1 }}>
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Панель бана пользователей */}
      {showBanPanel && isAdminVerified && (
        <div className="ban-panel-overlay" onClick={handleLogoutAdmin}>
          <div className="ban-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ban-panel-header">
              <h3>👑 Управление пользователями</h3>
              <button className="ban-panel-close" onClick={handleLogoutAdmin}>✕</button>
            </div>
            
            {banLoading ? (
              <div className="ban-panel-loading">Загрузка...</div>
            ) : (
              <div className="ban-panel-users">
                <p className="ban-panel-info">Всего пользователей: {users.length}</p>
                <div className="ban-panel-list">
                  {users.map((u) => (
                    <div key={u.id} className={`ban-user-item ${u.banned ? 'banned' : ''}`}>
                      <div className="ban-user-info">
                        <span className="ban-user-avatar">{u.avatar || '😊'}</span>
                        <div className="ban-user-details">
                          <span className="ban-user-name">{u.username}</span>
                          {u.banned && <span className="ban-user-badge">🚫 Заблокирован</span>}
                        </div>
                      </div>
                      <div className="ban-user-actions">
                        {u.banned ? (
                          <button className="ban-btn-unban" onClick={() => handleUnbanUser(u.id, u.username)}>
                            ✅ Разблокировать
                          </button>
                        ) : (
                          <button className="ban-btn-ban" onClick={() => handleBanUser(u.id, u.username)}>
                            🚫 Заблокировать
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
