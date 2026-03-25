import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme, themes } from "@/lib/theme";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const AVATARS = ["😊","😎","🤩","🥳","🐶","🐱","🦊","🐼","🐨","🦁","🌸","⚡","🔥","🌈","💎","🎮","🎸","🚀","👾","🍕","🦄","🐉","🌺","🎯","🏆","🎭","🎨","🌙","☀️","❤️"];

const ADMIN_PASSWORD = "vgd3303vgd";

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
  
  // Admin panel
  const [versionClicks, setVersionClicks] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

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

  // Admin panel functions
  const handleVersionClick = () => {
    const newCount = versionClicks + 1;
    setVersionClicks(newCount);
    
    if (newCount >= 5) {
      setVersionClicks(0);
      setShowAdminPanel(true);
    }
    
    // Сброс счетчика через 2 секунды
    setTimeout(() => setVersionClicks(0), 2000);
  };

  const checkAdminPassword = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      loadAdminUsers();
    } else {
      alert("❌ Неверный пароль!");
    }
  };

  const loadAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminUsers(usersList);
      setShowAdminPanel(false);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Ошибка загрузки пользователей");
    }
    setAdminLoading(false);
  };

  const banUser = async (userId: string) => {
    if (!confirm("Заблокировать пользователя?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { banned: true });
      alert("✅ Пользователь заблокирован");
      loadAdminUsers();
    } catch (error) {
      alert("Ошибка: " + error);
    }
  };

  const unbanUser = async (userId: string) => {
    if (!confirm("Разблокировать пользователя?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { banned: false });
      alert("✅ Пользователь разблокирован");
      loadAdminUsers();
    } catch (error) {
      alert("Ошибка: " + error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("⚠️ УДАЛИТЬ пользователя навсегда?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("✅ Пользователь удалён");
      loadAdminUsers();
    } catch (error) {
      alert("Ошибка: " + error);
    }
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

      <div className="settings-section">
        <h3 className="settings-section-title">О приложении</h3>
        <div
          onClick={handleVersionClick}
          style={{
            padding: '16px',
            background: 'var(--bg3)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>V-Message</p>
          <p style={{ fontSize: '14px', color: 'var(--text2)', margin: '8px 0 0 0' }}>Версия 2.7v</p>
          {versionClicks > 0 && versionClicks < 5 && (
            <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px' }}>
              Ещё {5 - versionClicks} раз(а)...
            </p>
          )}
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="modal-card" style={{ maxWidth: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🔐 Админ-панель</h3>
            <input
              type="password"
              placeholder="Введите пароль"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAdminPassword()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '14px',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="settings-btn-save"
                onClick={checkAdminPassword}
                style={{ flex: 1 }}
              >
                Войти
              </button>
              <button
                className="settings-btn-cancel"
                onClick={() => {
                  setShowAdminPanel(false);
                  setAdminPassword("");
                }}
                style={{ flex: 1 }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {adminLoading && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <div className="spinner-lg" />
            <p style={{ marginTop: '16px', color: 'var(--text2)' }}>Загрузка...</p>
          </div>
        </div>
      )}

      {adminUsers.length > 0 && (
        <div className="modal-overlay" onClick={() => setAdminUsers([])}>
          <div className="modal-card" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>👥 Управление пользователями ({adminUsers.length})</h3>
              <button className="modal-close" onClick={() => setAdminUsers([])}>✕</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Пользователь</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Статус</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>{user.avatar || '😊'}</span>
                      {user.username || 'Без имени'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text2)' }}>{user.email || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.banned ? (
                        <span style={{ color: 'var(--red)', fontSize: '12px' }}>🚫 Заблокирован</span>
                      ) : (
                        <span style={{ color: 'var(--green)', fontSize: '12px' }}>✅ Активен</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.banned ? (
                        <button
                          className="settings-btn-save"
                          onClick={() => unbanUser(user.id)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          ✅ Разблокировать
                        </button>
                      ) : (
                        <button
                          className="settings-btn-logout"
                          onClick={() => banUser(user.id)}
                          style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}
                        >
                          🚫 Бан
                        </button>
                      )}
                      <button
                        className="settings-btn-logout"
                        onClick={() => deleteUser(user.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--red)' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
