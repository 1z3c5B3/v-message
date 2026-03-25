import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function About() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"about" | "privacy" | "help">("about");

  const APP_VERSION = "2.4.0";

  const features = [
    "💬 Текстовые сообщения",
    "🎤 Голосовые сообщения",
    "📷 Фото и видео",
    "📎 Файлы до 100 MB",
    "🙂 Стикеры и эмодзи",
    "❤️ Реакции на сообщения",
    "📞 Видеозвонки HD",
    "🎙️ Голосовые звонки",
    "👥 Групповые чаты",
    "📢 Каналы",
    "🔔 Push-уведомления",
    "🔍 Поиск по сообщениям",
    "📌 Закрепление чатов",
    "📦 Архив чатов",
    "🚫 Блокировка пользователей",
    "✏️ Редактирование сообщений",
    "↩️ Ответы на сообщения",
    "➡️ Пересылка сообщений",
    "📋 Копирование сообщений",
    "🗑️ Удаление сообщений",
    "🌙 Тёмная тема",
    "🎨 5 цветовых тем",
    "🔒 Приватность",
    "⚡ PWA технология",
  ];

  return (
    <div className="about-page">
      <div className="about-header">
        <h2>О приложении</h2>
      </div>

      <div className="about-tabs">
        <button
          className={`about-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          📱 О приложении
        </button>
        <button
          className={`about-tab ${activeTab === "privacy" ? "active" : ""}`}
          onClick={() => setActiveTab("privacy")}
        >
          🔒 Приватность
        </button>
        <button
          className={`about-tab ${activeTab === "help" ? "active" : ""}`}
          onClick={() => setActiveTab("help")}
        >
          ❓ Помощь
        </button>
      </div>

      {activeTab === "about" && (
        <div className="about-content">
          <div className="about-logo-section">
            <div className="about-logo">💬</div>
            <h1 className="about-title">V-Message</h1>
            <p className="about-version">Версия {APP_VERSION}</p>
            <p className="about-slogan">Современный мессенджер для общения</p>
          </div>

          <div className="about-description">
            <p>
              V-Message — это быстрый и безопасный мессенджер с поддержкой 
              видеозвонков, голосовых сообщений и файлов. Общайтесь с друзьями 
              и коллегами в любое время и в любом месте.
            </p>
          </div>

          <div className="about-features">
            <h3 className="about-features-title">🚀 Возможности приложения</h3>
            <div className="about-features-grid">
              {features.map((feature, index) => (
                <div key={index} className="about-feature-item">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="about-tech">
            <h3 className="about-tech-title">🛠️ Технологии</h3>
            <div className="about-tech-list">
              <div className="about-tech-item">React 19</div>
              <div className="about-tech-item">TypeScript</div>
              <div className="about-tech-item">Vite 7</div>
              <div className="about-tech-item">Firebase</div>
              <div className="about-tech-item">WebRTC</div>
              <div className="about-tech-item">PWA</div>
            </div>
          </div>

          <div className="about-developer">
            <h3 className="about-developer-title">👨‍💻 Разработчик</h3>
            <p className="about-developer-text">
              V-Message разработан с любовью к современным технологиям. 
              Мы стремимся сделать общение простым, быстрым и безопасным.
            </p>
          </div>

          <div className="about-copyright">
            <p>© 2024-2025 V-Message. Все права защищены.</p>
          </div>
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="privacy-content">
          <h3 className="privacy-title">🔒 Политика конфиденциальности</h3>
          
          <div className="privacy-section">
            <h4>1. Сбор информации</h4>
            <p>
              Мы собираем минимально необходимую информацию для работы приложения:
            </p>
            <ul>
              <li>Имя пользователя и аватар</li>
              <li>Email для входа и восстановления</li>
              <li>Сообщения и файлы для обмена</li>
              <li>Токены уведомлений</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h4>2. Использование информации</h4>
            <p>Ваша информация используется только для:</p>
            <ul>
              <li>Работы мессенджера</li>
              <li>Отправки уведомлений</li>
              <li>Восстановления доступа</li>
              <li>Улучшения сервиса</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h4>3. Защита данных</h4>
            <p>
              Мы используем современные методы шифрования и защиты данных:
            </p>
            <ul>
              <li>HTTPS соединение</li>
              <li>Шифрование сообщений</li>
              <li>Безопасное хранение паролей</li>
              <li>Защита от несанкционированного доступа</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h4>4. Ваши права</h4>
            <p>Вы имеете право:</p>
            <ul>
              <li>Удалить свой аккаунт в любой момент</li>
              <li>Экспортировать свои данные</li>
              <li>Заблокировать других пользователей</li>
              <li>Отключить уведомления</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h4>5. Контакты</h4>
            <p>
              По вопросам конфиденциальности обращайтесь: 
              <a href="mailto:privacy@vmsg.app">privacy@vmsg.app</a>
            </p>
          </div>
        </div>
      )}

      {activeTab === "help" && (
        <div className="help-content">
          <h3 className="help-title">❓ Помощь и поддержка</h3>

          <div className="help-faq">
            <h4>Частые вопросы</h4>
            
            <details className="help-details">
              <summary>Как изменить имя пользователя?</summary>
              <p>
                Откройте Настройки → Имя пользователя → Введите новое имя → Сохранить.
                Имя можно менять неограниченное количество раз.
              </p>
            </details>

            <details className="help-details">
              <summary>Как удалить сообщение?</summary>
              <p>
                Зажмите сообщение пальцем (долгое нажатие) → Выберите "Удалить".
                Удалить можно только свои сообщения.
              </p>
            </details>

            <details className="help-details">
              <summary>Как отправить голосовое сообщение?</summary>
              <p>
                Нажмите на кнопку 🎤 в поле ввода сообщения. Запишите сообщение 
                и нажмите ➤ для отправки или ✕ для отмены.
              </p>
            </details>

            <details className="help-details">
              <summary>Как совершить видеозвонок?</summary>
              <p>
                Откройте чат → Нажмите на кнопку 📹 в заголовке. 
                Дождитесь ответа собеседника.
              </p>
            </details>

            <details className="help-details">
              <summary>Как включить тёмную тему?</summary>
              <p>
                Откройте Настройки → Внешний вид → Выберите тему "Тёмная" 
                или любую другую из доступных.
              </p>
            </details>

            <details className="help-details">
              <summary>Как заблокировать пользователя?</summary>
              <p>
                Откройте профиль пользователя → Нажмите "Заблокировать".
                Заблокированный пользователь не сможет писать вам.
              </p>
            </details>

            <details className="help-details">
              <summary>Как создать группу?</summary>
              <p>
                Контакты → Создать группу → Выберите участников → 
                Введите название → Создайте группу.
              </p>
            </details>

            <details className="help-details">
              <summary>Что такое PWA?</summary>
              <p>
                PWA (Progressive Web App) — технология, позволяющая установить 
                веб-приложение как обычное на ваш телефон или компьютер.
              </p>
            </details>
          </div>

          <div className="help-support">
            <h4>📧 Служба поддержки</h4>
            <p>
              Если вы не нашли ответ на свой вопрос, обратитесь в службу поддержки:
            </p>
            <a href="mailto:support@vmsg.app" className="help-email">
              support@vmsg.app
            </a>
          </div>

          <div className="help-community">
            <h4>👥 Сообщество</h4>
            <p>
              Присоединяйтесь к нашему сообществу для обсуждения нововведений 
              и обмена опытом:
            </p>
            <button className="help-btn" onClick={() => alert('Функция в разработке')}>
              Открыть чат поддержки
            </button>
          </div>

          <div className="help-rate">
            <h4>⭐ Оцените приложение</h4>
            <p>
              Если вам нравится V-Message, поставьте нам оценку!
            </p>
            <div className="help-stars">
              {['⭐', '⭐', '⭐', '⭐', '⭐'].map((star, i) => (
                <button key={i} className="help-star" onClick={() => alert('Спасибо за оценку!')}>
                  {star}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
