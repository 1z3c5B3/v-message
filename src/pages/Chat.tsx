import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  doc, setDoc, deleteDoc, updateDoc,
} from "firebase/firestore";
import VideoCall from "@/components/VideoCall";
import IncomingCall from "@/components/IncomingCall";
import StickerPicker from "@/components/StickerPicker";
import AudioPlayer from "@/components/AudioPlayer";
import { uploadFile, uploadAudio, formatFileSize, compressImage, generateVideoThumbnail } from "@/lib/fileUpload";
import { useVoiceRecorder, formatRecordingTime } from "@/hooks/useVoiceRecorder";
import { sendCallNotification } from "@/lib/onesignal";

// Уведомления работают через Firestore в реальном времени
// Когда получатель онлайн - он видит сообщения мгновенно

interface Message {
  id: string;
  text: string;
  type: "text" | "sticker" | "image" | "file" | "voice" | "video";
  uid: string;
  username: string;
  createdAt: any;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  filePath?: string;
  duration?: number;
  edited?: boolean;
  editedAt?: any;
  reactions?: { [emoji: string]: string[] };
  thumbnailUrl?: string;
  replyTo?: { messageId: string; text: string; username: string };
}

interface Props {
  contact: UserProfile;
  onBack: () => void;
}

export default function Chat({ contact, onBack }: Props) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [callState, setCallState] = useState<{ callId: string; isCaller: boolean } | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [contactOnline, setContactOnline] = useState(contact.online);
  const [uploading, setUploading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [longPressMenu, setLongPressMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [forwardMenu, setForwardMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const convoId = user ? [user.uid, contact.uid].sort().join("_") : "";

  useEffect(() => {
    if (!convoId) return;
    const q = query(collection(db, "conversations", convoId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }, [convoId]);

  // Вставка из буфера обмена
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !user || !profile || !convoId) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (!blob) return;

          setUploading(true);
          try {
            const uploaded = await uploadFile(blob, user.uid);
            await send('📸 Скриншот', 'image', {
              fileUrl: uploaded.url,
              fileName: 'screenshot.png',
              fileSize: uploaded.size,
              fileType: uploaded.type,
              filePath: uploaded.path,
            });
          } catch (err) {
            console.error('Paste error:', err);
          } finally {
            setUploading(false);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [user, profile, convoId]);

  useEffect(() => {
    if (!convoId) return;
    const typingRef = doc(db, "conversations", convoId, "typing", contact.uid);
    return onSnapshot(typingRef, (snap) => {
      setIsTyping(snap.exists() && snap.data()?.typing === true);
    });
  }, [convoId, contact.uid]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", contact.uid), (snap) => {
      if (snap.exists()) setContactOnline(snap.data()?.online ?? false);
    });
  }, [contact.uid, user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "calls"), (snap) => {
      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (change.type === "added" && data.callee === user.uid && data.caller === contact.uid && data.status === "calling") {
          setIncomingCall({ ...data, callId: change.doc.id });
        }
        if (change.type === "removed") setIncomingCall(null);
      });
    });
  }, [user, contact.uid]);

  const handleTextChange = async (val: string) => {
    setText(val);
    if (!user || !convoId) return;
    const ref = doc(db, "conversations", convoId, "typing", user.uid);
    await setDoc(ref, { typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => deleteDoc(ref).catch(() => {}), 3000);
  };

  const send = async (msgText: string, type: "text" | "sticker" | "image" | "file" | "voice" = "text", fileData?: Partial<Message>) => {
    if (!user || !profile || !convoId) {
      console.error('Cannot send: user/profile/convoId not loaded');
      return;
    }
    if (type === "text" && !msgText.trim()) return;

    const ref = doc(db, "conversations", convoId, "typing", user.uid);
    deleteDoc(ref).catch(() => {});

    const messageData: any = {
      text: msgText,
      type,
      uid: user.uid,
      username: profile.username,
      createdAt: serverTimestamp(),
      ...fileData,
    };

    // Добавляем replyTo только если есть ответ
    if (replyMessage) {
      messageData.replyTo = {
        messageId: replyMessage.id,
        text: replyMessage.text.substring(0, 100),
        username: replyMessage.username
      };
    }

    await addDoc(collection(db, "conversations", convoId, "messages"), messageData);

    // Отправляем push-уведомление через OneSignal (если это не стикер)
    if (type !== "sticker" && contact.uid) {
      const notificationText = type === "image" ? "📷 Фото"
        : type === "file" ? `📎 Файл: ${fileData?.fileName || "Файл"}`
        : type === "voice" ? "🎤 Голосовое сообщение"
        : type === "video" ? "🎬 Видео"
        : msgText.substring(0, 50);
      await sendNotification(contact.uid, profile.username, notificationText, "message");
    }

    if (replyMessage) {
      setReplyMessage(null);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Остановить запись и отправить
      try {
        const blob = await stopRecording();
        setShowVoicePreview(false);
        setUploading(true);

        const uploaded = await uploadAudio(blob, user!.uid);
        await send(
          "🎤 Голосовое сообщение",
          "voice",
          {
            fileUrl: uploaded.url,
            fileName: uploaded.name,
            fileSize: uploaded.size,
            fileType: uploaded.type,
            filePath: uploaded.path,
            duration: recordingTime,
          }
        );
      } catch (err) {
        console.error("Voice recording error:", err);
        alert("Ошибка записи");
      } finally {
        setUploading(false);
      }
    } else {
      // Начать запись
      try {
        await startRecording();
        setShowVoicePreview(true);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Нет доступа к микрофону");
      }
    }
  };

  const handleVoiceCancel = () => {
    cancelRecording();
    setShowVoicePreview(false);
  };

  const handleLongPress = (msg: Message, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setLongPressMenu({ msg, x: clientX, y: clientY });
  };

  const handleDeleteMessage = async (msg: Message) => {
    if (msg.uid !== user?.uid) {
      alert('Можно удалить только свои сообщения');
      return;
    }
    if (!confirm('Удалить сообщение?')) return;
    
    try {
      await deleteDoc(doc(db, "conversations", convoId, "messages", msg.id));
      setLongPressMenu(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении');
    }
  };

  const handleCopyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setLongPressMenu(null);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setText(msg.text);
    setLongPressMenu(null);
  };

  const handleReplyMessage = (msg: Message) => {
    setReplyMessage(msg);
    setLongPressMenu(null);
  };

  const handleForwardMessage = (msg: Message, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setForwardMenu({ msg, x: clientX, y: clientY });
    setLongPressMenu(null);
  };

  const saveEditMessage = async () => {
    if (!editingMessage || !text.trim()) return;
    
    try {
      await updateDoc(doc(db, "conversations", convoId, "messages", editingMessage.id), {
        text: text.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessage(null);
      setText("");
    } catch (err) {
      console.error('Ошибка редактирования:', err);
      alert('Ошибка при редактировании');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setText("");
  };

  const cancelReply = () => {
    setReplyMessage(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile || !convoId) return;

    // Увеличенный лимит до 100MB
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("Файл слишком большой. Максимум 100MB");
      return;
    }

    setUploading(true);
    try {
      let uploaded;
      let messageType: "image" | "file" | "video" = "file";
      let thumbnailUrl: string | undefined;

      // Сжатие изображений
      if (file.type.startsWith("image/")) {
        messageType = "image";
        const compressed = await compressImage(file);
        const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        uploaded = await uploadFile(compressedFile, user.uid);
      } else if (file.type.startsWith("video/")) {
        messageType = "video";
        // Генерация превью для видео
        const thumbnail = await generateVideoThumbnail(file);
        if (thumbnail) {
          const thumbFile = new File([thumbnail], "thumbnail.jpg", { type: "image/jpeg" });
          const thumbUpload = await uploadFile(thumbFile, user.uid);
          thumbnailUrl = thumbUpload.url;
        }
        uploaded = await uploadFile(file, user.uid);
      } else {
        uploaded = await uploadFile(file, user.uid);
      }

      const isImage = messageType === "image";
      const isVideo = messageType === "video";
      await send(
        isImage ? "📷 Фото" : isVideo ? "🎬 Видео" : `📎 Файл: ${file.name}`,
        messageType,
        {
          fileUrl: uploaded.url,
          fileName: uploaded.name,
          fileSize: uploaded.size,
          fileType: uploaded.type,
          filePath: uploaded.path,
          thumbnailUrl,
        }
      );
    } catch (err) {
      console.error("File upload error:", err);
      alert("Ошибка загрузки файла");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile || !convoId) {
      alert('Ошибка: пользователь не загружен. Попробуйте обновить страницу.');
      return;
    }

    // Быстрые команды
    if (text.startsWith('/me ')) {
      const action = text.substring(4);
      await send(`*${profile?.username} ${action}*`, 'text');
      setText("");
      return;
    }
    if (text.startsWith('/gif ')) {
      const query = text.substring(5);
      await send(`🎬 GIF: ${query}`, 'text');
      setText("");
      return;
    }

    await send(text.trim());
    setText("");
    setShowStickers(false);
  };

  const startCall = async () => {
    if (!user?.uid) {
      alert('Ошибка: пользователь не авторизован');
      return;
    }
    if (!profile?.username) {
      alert('Ошибка: профиль не загружен');
      return;
    }
    if (calling) {
      console.log('Звонок уже идёт...');
      return;
    }

    console.log('=== Начало звонка ===');
    console.log('Caller:', user.uid, profile.username);
    console.log('Callee:', contact.uid, contact.username);

    setCalling(true);
    try {
      const callsRef = collection(db, "calls");
      const callData = {
        caller: user.uid,
        callerName: profile.username,
        callee: contact.uid,
        calleeName: contact.username,
        status: "calling",
        createdAt: serverTimestamp(),
        type: "video"
      };

      console.log('Создаю документ в calls...', callData);
      const ref = await addDoc(callsRef, callData);
      console.log('Звонок создан! ID:', ref.id);

      // Отправляем Push-уведомление о звонке
      await sendCallNotification(contact.uid, profile.username, "video", ref.id);
      console.log('Push-уведомление отправлено');

      setCallState({ callId: ref.id, isCaller: true });
    } catch (error) {
      console.error('=== Ошибка звонка ===');
      console.error(error);
      alert('Не удалось создать звонок: ' + (error as Error).message);
      setCalling(false);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const groups: { date: string; msgs: Message[] }[] = [];
  let lastDate = "";
  
  // Фильтрация по поиску
  const filteredMessages = searchQuery
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  
  for (const m of filteredMessages) {
    const d = m.createdAt?.toDate?.() || new Date();
    const ds = d.toLocaleDateString("ru", { day: "numeric", month: "long" });
    if (ds !== lastDate) { groups.push({ date: ds, msgs: [] }); lastDate = ds; }
    groups[groups.length - 1].msgs.push(m);
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button className="btn-back" onClick={onBack}>←</button>
        <div className="chat-header-info" onClick={() => console.log('Header clicked')}>
          <span className="chat-header-avatar">{contact.avatar}</span>
          <div>
            <div className="chat-header-name">{contact.username}</div>
            <div className={`chat-header-status ${contactOnline ? "online" : ""}`}>
              {isTyping ? "⌨️ печатает..." : contactOnline ? "онлайн" : "не в сети"}
            </div>
          </div>
        </div>
        <button
          className="btn-search"
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(!showSearch);
          }}
          title="Поиск"
        >
          🔍
        </button>
        <button
          className="btn-video-call"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Кнопка звонка нажата!');
            startCall();
          }}
          disabled={calling}
          title="Видеозвонок"
          style={{ opacity: calling ? 0.5 : 1, cursor: calling ? 'not-allowed' : 'pointer' }}
        >
          {calling ? "📞..." : "📹"}
        </button>
      </div>

      {showSearch && (
        <div className="search-bar-chat">
          <input
            type="text"
            className="search-input-chat"
            placeholder="Поиск сообщений..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="btn-close-search" onClick={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}>✕</button>
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
                  <div
                    key={m.id}
                    className={`msg-row ${mine ? "mine" : "theirs"}`}
                    onMouseDown={(e) => handleLongPress(m, e)}
                    onTouchStart={(e) => handleLongPress(m, e)}
                  >
                    {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                    <div className="msg-sticker">
                      <span className="sticker-big">{m.text}</span>
                      <span className="sticker-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              if (m.type === "image") {
                return (
                  <div
                    key={m.id}
                    className={`msg-row ${mine ? "mine" : "theirs"}`}
                    onMouseDown={(e) => handleLongPress(m, e)}
                    onTouchStart={(e) => handleLongPress(m, e)}
                  >
                    {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                    <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="msg-image-link">
                        <img src={m.fileUrl} alt={m.fileName || "Image"} className="msg-image" />
                      </a>
                      <span className="msg-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              if (m.type === "file") {
                return (
                  <div
                    key={m.id}
                    className={`msg-row ${mine ? "mine" : "theirs"}`}
                    onMouseDown={(e) => handleLongPress(m, e)}
                    onTouchStart={(e) => handleLongPress(m, e)}
                  >
                    {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                    <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="msg-file-link">
                        <span className="msg-file-icon">📎</span>
                        <div className="msg-file-info">
                          <span className="msg-file-name">{m.fileName}</span>
                          <span className="msg-file-size">{formatFileSize(m.fileSize || 0)}</span>
                        </div>
                      </a>
                      <span className="msg-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              if (m.type === "voice") {
                return (
                  <div
                    key={m.id}
                    className={`msg-row ${mine ? "mine" : "theirs"}`}
                    onMouseDown={(e) => handleLongPress(m, e)}
                    onTouchStart={(e) => handleLongPress(m, e)}
                  >
                    {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                    <div className={`msg-bubble ${mine ? "mine" : "theirs"} msg-voice`}>
                      <AudioPlayer src={m.fileUrl} duration={m.duration} />
                      <span className="msg-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              if (m.type === "video") {
                return (
                  <div
                    key={m.id}
                    className={`msg-row ${mine ? "mine" : "theirs"}`}
                    onMouseDown={(e) => handleLongPress(m, e)}
                    onTouchStart={(e) => handleLongPress(m, e)}
                  >
                    {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                    <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                      <video
                        src={m.fileUrl}
                        controls
                        className="msg-video"
                        poster={m.thumbnailUrl}
                      />
                      <span className="msg-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  id={`msg-${m.id}`}
                  key={m.id}
                  className={`msg-row ${mine ? "mine" : "theirs"}`}
                  onMouseDown={(e) => handleLongPress(m, e)}
                  onTouchStart={(e) => handleLongPress(m, e)}
                >
                  {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                  <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                    {m.replyTo && (
                      <div className="msg-reply" onClick={() => {
                        const el = document.getElementById(`msg-${m.replyTo?.messageId}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}>
                        <span className="msg-reply-line"></span>
                        <span className="msg-reply-text">{m.replyTo.text}</span>
                      </div>
                    )}
                    <span className="msg-text">{m.text}</span>
                    <div className="msg-meta">
                      <span className="msg-time">
                        {formatTime(m.createdAt)}
                        {m.edited && ' (изм.)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {isTyping && (
          <div className="msg-row theirs">
            <span className="msg-avatar">{contact.avatar}</span>
            <div className="typing-bubble"><span /><span /><span /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {longPressMenu && (
        <>
          <div className="long-press-overlay" onClick={() => setLongPressMenu(null)} />
          <div className="long-press-menu" style={{ top: longPressMenu.y - 80, left: longPressMenu.x - 100 }}>
            <button className="long-press-option" onClick={() => handleCopyMessage(longPressMenu.msg)}>
              📋 Копировать
            </button>
            <button className="long-press-option" onClick={() => handleReplyMessage(longPressMenu.msg)}>
              ↩️ Ответить
            </button>
            {longPressMenu.msg.uid === user?.uid && (
              <>
                <button className="long-press-option" onClick={() => handleEditMessage(longPressMenu.msg)}>
                  ✏️ Изменить
                </button>
                <button className="long-press-option delete" onClick={() => handleDeleteMessage(longPressMenu.msg)}>
                  🗑️ Удалить
                </button>
              </>
            )}
            <button className="long-press-option" onClick={(e) => handleForwardMessage(longPressMenu.msg, e)}>
              ➡️ Переслать
            </button>
          </div>
        </>
      )}

      {forwardMenu && (
        <>
          <div className="long-press-overlay" onClick={() => setForwardMenu(null)} />
          <div className="long-press-menu" style={{ top: forwardMenu.y - 40, left: forwardMenu.x - 100 }}>
            <button className="long-press-option" onClick={() => {
              // Пересылка в текущий чат
              send(`↪️ Пересланное сообщение:\n${forwardMenu.msg.text}`, 'text');
              setForwardMenu(null);
            }}>
              ➡️ Переслать сюда
            </button>
            <button className="long-press-option" onClick={() => setForwardMenu(null)}>
              ✕ Отмена
            </button>
          </div>
        </>
      )}

      {showStickers && (
        <StickerPicker onSend={(s) => send(s, "sticker")} onClose={() => setShowStickers(false)} />
      )}

      {showVoicePreview && (
        <div className="voice-preview">
          <div className="voice-preview-content">
            <span className="voice-icon">{isRecording ? "🔴" : "🎤"}</span>
            <span className="voice-timer">{formatRecordingTime(recordingTime)}</span>
            {isRecording ? (
              <span className="voice-wave">
                <span /><span /><span /><span /><span />
              </span>
            ) : null}
          </div>
          <div className="voice-preview-actions">
            {isRecording ? (
              <>
                <button type="button" className="btn-voice-cancel" onClick={handleVoiceCancel} title="Отменить">
                  ✕
                </button>
                <button type="button" className="btn-voice-send" onClick={handleVoiceRecord} title="Отправить">
                  ➤
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {replyMessage && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-preview-label">↩️ Ответ @{replyMessage.username}</span>
            <span className="reply-preview-text">{replyMessage.text.substring(0, 80)}{replyMessage.text.length > 80 ? '...' : ''}</span>
          </div>
          <button type="button" className="reply-preview-cancel" onClick={cancelReply}>✕</button>
        </div>
      )}

      {editingMessage && (
        <div className="edit-preview">
          <div className="edit-preview-content">
            <span className="edit-preview-label">✏️ Редактирование сообщения</span>
          </div>
          <button type="button" className="edit-preview-cancel" onClick={cancelEdit}>✕</button>
        </div>
      )}

      <form className="chat-input-bar" onSubmit={editingMessage ? (e) => { e.preventDefault(); saveEditMessage(); } : sendText}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          style={{ display: "none" }}
        />
        <button type="button" className="btn-file" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Прикрепить файл">
          {uploading ? <span className="spinner-sm" /> : "📎"}
        </button>
        <button type="button" className="btn-sticker" onClick={(e) => { e.stopPropagation(); setShowStickers(!showStickers); }}>
          🙂
        </button>
        <button
          type="button"
          className={`btn-voice ${isRecording ? "recording" : ""}`}
          onClick={handleVoiceRecord}
          disabled={uploading}
          title={isRecording ? "Записать голосовое" : "Отправить голосовое"}
        >
          🎤
        </button>
        <input type="text" className="chat-input" placeholder="Сообщение..."
          value={text} onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => setShowStickers(false)} />
        <button type="submit" className="btn-send" disabled={!text.trim() || uploading}>
          ➤
        </button>
      </form>

      {callState && (
        <VideoCall callId={callState.callId} isCaller={callState.isCaller}
          contactName={contact.username} onEnd={() => setCallState(null)} />
      )}
      {incomingCall && !callState && (
        <IncomingCall callerName={incomingCall.callerName} callId={incomingCall.callId}
          onAccept={() => { setCallState({ callId: incomingCall.callId, isCaller: false }); setIncomingCall(null); }}
          onDecline={() => setIncomingCall(null)} />
      )}
    </div>
  );
}
