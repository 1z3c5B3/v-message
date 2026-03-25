import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "register";

const AVATARS = ["😊","😎","🤩","🥳","🐶","🐱","🦊","🐼","🐨","🦁","🌸","⚡","🔥","🌈","💎","🎮","🎸","🚀","👾","🍕"];

// Генерация простой капчи (математический пример)
function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ["+", "-", "*"];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer: number;
  switch (operator) {
    case "+": answer = num1 + num2; break;
    case "-": answer = num1 - num2; break;
    case "*": answer = num1 * num2; break;
    default: answer = num1 + num2;
  }

  return {
    question: `${num1} ${operator} ${num2} = ?`,
    answer
  };
}

export default function Auth() {
  const { login, register, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("😊");
  const [showAvatars, setShowAvatars] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Состояние капчи
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user") {
        setError("Вход отменён");
      } else if (code === "auth/network-request-failed") {
        setError("Ошибка сети. Проверь подключение");
      } else if (code === "auth/account-exists-with-different-credential") {
        setError("Аккаунт уже существует с другим способом входа");
      } else {
        setError(err?.message || "Ошибка при входе через Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaptchaError("");
    
    // Проверка капчи
    const userAnswer = parseInt(captchaInput.trim(), 10);
    if (isNaN(userAnswer) || userAnswer !== captcha.answer) {
      setCaptchaError("Неверная капча. Попробуй ещё раз");
      refreshCaptcha();
      return;
    }
    
    const u = username.trim();
    if (!u || u.length < 2) { setError("Имя пользователя — минимум 2 символа"); return; }
    if (password.length < 6) { setError("Пароль — минимум 6 символов"); return; }
    
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await register(u, password, avatar);
      } else {
        await login(u, password);
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Неверное имя или пароль");
      } else if (code === "auth/email-already-in-use" || code === "auth/username-already-in-use") {
        setError("Это имя уже занято");
      } else if (code === "auth/weak-password") {
        setError("Пароль слишком простой");
      } else if (code === "auth/popup-closed-by-user") {
        setError("Вход отменён");
      } else if (code === "auth/network-request-failed") {
        setError("Ошибка сети. Проверь подключение");
      } else {
        setError(err?.message || "Ошибка. Попробуй ещё раз");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <h1 className="auth-app-name">V-Message</h1>
          <p className="auth-version">2.5v</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setCaptchaError(""); }}>Войти</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); setCaptchaError(""); }}>Регистрация</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="avatar-pick-wrap">
              <button type="button" className="avatar-pick-btn" onClick={() => setShowAvatars(!showAvatars)}>
                <span className="avatar-pick-icon">{avatar}</span>
                <span>Выбери аватар</span>
              </button>
              {showAvatars && (
                <div className="avatar-grid">
                  {AVATARS.map((a) => (
                    <button type="button" key={a} className={`avatar-opt ${avatar === a ? "selected" : ""}`}
                      onClick={() => { setAvatar(a); setShowAvatars(false); }}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="auth-field">
            <label>Имя пользователя</label>
            <input type="text" placeholder="Введи имя" value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20} autoComplete="username" autoCapitalize="none" />
          </div>

          <div className="auth-field">
            <label>Пароль</label>
            <div className="pass-wrap">
              <input type={showPass ? "text" : "password"} placeholder="Минимум 6 символов"
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"} />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Капча */}
          <div className="auth-field">
            <label>Проверка (капча)</label>
            <div className="captcha-wrap">
              <span className="captcha-question">{captcha.question}</span>
              <button type="button" className="captcha-refresh" onClick={refreshCaptcha} title="Обновить">
                🔄
              </button>
            </div>
            <input type="text" placeholder="Введите ответ" value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="captcha-input"
              maxLength={5} autoComplete="off" />
            {captchaError && <p className="auth-error captcha-error">{captchaError}</p>}
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <div className="auth-divider">
          <span>или</span>
        </div>

        <button type="button" className="auth-google-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading ? "Загрузка..." : "Войти через Google"}</span>
        </button>
      </div>
    </div>
  );
}
