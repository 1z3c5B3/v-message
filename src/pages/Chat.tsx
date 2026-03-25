import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  doc, setDoc, deleteDoc, getDoc, updateDoc, where,
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
  starred?: boolean;
  thumbnailUrl?: string;
  pinned?: boolean;
  replyTo?: { messageId: string; text: string };
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
  const [showStarred, setShowStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Context menu for messages
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; messageId: string; x: number; y: number } | null>(null);
  const [showReactions, setShowReactions] = useState<{ visible: boolean; messageId: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  
  // Chat settings
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatDescription, setChatDescription] = useState("");
  const [isChannel, setIsChannel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [drafts, setDrafts] = useState<{[key: string]: string}>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [chatStats, setChatStats] = useState({ total: 0, mine: 0, theirs: 0 });
  const [showStats, setShowStats] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<any>(null);

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

  // Drag and drop for files
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files) {
        handleAttachFiles(e.dataTransfer.files);
      }
    };
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    
    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, []);

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
    
    // Save draft
    if (convoId && val.trim()) {
      setDrafts(prev => ({ ...prev, [convoId]: val }));
    }
    
    if (!user || !convoId) return;
    const ref = doc(db, "conversations", convoId, "typing", user.uid);
    await setDoc(ref, { typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => deleteDoc(ref).catch(() => {}), 3000);
  };

  // Load draft on mount
  useEffect(() => {
    if (convoId && drafts[convoId]) {
      setText(drafts[convoId]);
    }
  }, [convoId]);

  const send = async (msgText: string, type: "text" | "sticker" | "image" | "file" | "voice" = "text", fileData?: Partial<Message>) => {
    if (!user || !profile || !convoId) return;
    // Для стикеров и файлов разрешаем пустой текст
    if (type === "text" && !msgText.trim()) return;
    
    const ref = doc(db, "conversations", convoId, "typing", user.uid);
    deleteDoc(ref).catch(() => {});
    
    const messageData = {
      text: msgText,
      type,
      uid: user.uid,
      username: profile.username,
      createdAt: serverTimestamp(),
      ...fileData,
    };
    
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

  // Context menu functions
  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, message: Message) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ visible: true, messageId: message.id, x: clientX, y: clientY });
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    closeContextMenu();
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!convoId || !user?.uid) return;
    try {
      const messagesRef = collection(db, "conversations", convoId, "messages");
      const msgRef = doc(messagesRef, messageId);
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;

      const msgData = msgSnap.data();
      const reactions = msgData.reactions || {};

      let userAlreadyReacted = false;
      for (const [e, uids] of Object.entries(reactions)) {
        if (uids.includes(user.uid)) {
          reactions[e] = uids.filter((uid: string) => uid !== user.uid);
          if (e === emoji) userAlreadyReacted = true;
        }
        if (reactions[e].length === 0) delete reactions[e];
      }

      if (!userAlreadyReacted) {
        if (!reactions[emoji]) reactions[emoji] = [];
        reactions[emoji].push(user.uid);
      }

      await updateDoc(msgRef, { reactions });
      setShowReactions(null);
    } catch (err) {
      console.error("Add reaction error:", err);
    }
  };

  const handleForward = async (message: Message) => {
    // TODO: Implement forward dialog
    alert("Пересылка: " + message.text.substring(0, 50));
    closeContextMenu();
  };

  const handleStar = async (messageId: string) => {
    if (!convoId) return;
    try {
      const messagesRef = collection(db, "conversations", convoId, "messages");
      const msgSnap = await getDoc(doc(messagesRef, messageId));
      if (!msgSnap.exists()) return;
      const current = msgSnap.data().starred || false;
      await updateDoc(doc(messagesRef, messageId), { starred: !current });
      closeContextMenu();
    } catch (err) {
      console.error("Star error:", err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!convoId) return;
    try {
      const messagesRef = collection(db, "conversations", convoId, "messages");
      await deleteDoc(doc(messagesRef, messageId));
      closeContextMenu();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!convoId) return;
    try {
      const messagesRef = collection(db, "conversations", convoId, "messages");
      const msgSnap = await getDoc(doc(messagesRef, messageId));
      if (!msgSnap.exists()) return;
      const current = msgSnap.data().pinned || false;
      await updateDoc(doc(messagesRef, messageId), { pinned: !current });
      
      // Load pinned messages
      const pinnedQuery = query(messagesRef, where("pinned", "==", true));
      const pinnedSnap = await getDocs(pinnedQuery);
      setPinnedMessages(pinnedSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Message));
      
      closeContextMenu();
    } catch (err) {
      console.error("Pin error:", err);
    }
  };

  const handleAttachFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    setAttachedFiles(prev => [...prev, ...fileArray]);
  };

  const calculateStats = () => {
    const total = messages.length;
    const mine = messages.filter(m => m.uid === user?.uid).length;
    const theirs = total - mine;
    setChatStats({ total, mine, theirs });
    setShowStats(true);
  };

  const exportChat = async () => {
    const chatData = {
      contact: contact.username,
      exportDate: new Date().toISOString(),
      messages: messages.map(m => ({
        username: m.username,
        text: m.text,
        type: m.type,
        createdAt: m.createdAt?.toDate?.().toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${contact.username}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chat settings functions
  const openChatSettings = () => {
    setChatName(contact.username);
    setShowChatSettings(true);
  };

  const saveChatSettings = async () => {
    // TODO: Save chat settings to Firestore
    alert("Настройки сохранены: " + chatName);
    setShowChatSettings(false);
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

  const startAudioCall = async () => {
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

    console.log('=== Начало аудиозвонка ===');
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
        type: "audio"
      };

      console.log('Создаю документ в calls...', callData);
      const ref = await addDoc(callsRef, callData);
      console.log('Аудиозвонок создан! ID:', ref.id);

      // Отправляем Push-уведомление о звонке
      await sendCallNotification(contact.uid, profile.username, "audio", ref.id);
      console.log('Push-уведомление отправлено');

      setCallState({ callId: ref.id, isCaller: true });
    } catch (error) {
      console.error('=== Ошибка аудиозвонка ===');
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
          className="btn-starred"
          onClick={(e) => {
            e.stopPropagation();
            setShowPinned(!showPinned);
          }}
          title="Закреплённые"
        >
          📌
        </button>
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
          className="btn-starred"
          onClick={(e) => {
            e.stopPropagation();
            setShowStarred(!showStarred);
          }}
          title="Избранное"
        >
          ⭐
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
        <button
          className="btn-video-call"
          onClick={(e) => {
            e.stopPropagation();
            startAudioCall();
          }}
          disabled={calling}
          title="Аудиозвонок"
          style={{ opacity: calling ? 0.5 : 1, cursor: calling ? 'not-allowed' : 'pointer' }}
        >
          {calling ? "📞..." : "📞"}
        </button>
        <button
          className="btn-starred"
          onClick={(e) => {
            e.stopPropagation();
            setShowPinned(!showPinned);
          }}
          title="Закреплённые"
        >
          📌
        </button>
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
          className="btn-search"
          onClick={(e) => {
            e.stopPropagation();
            openChatSettings();
          }}
          title="Настройки чата"
        >
          ⚙️
        </button>
        <div style={{ width: '8px' }} />
        <div style={{ flex: 1 }} />
        {contactOnline && (
          <div style={{ width: '10px', height: '10px', background: '#3fb950', borderRadius: '50%', boxShadow: '0 0 8px #3fb950' }} title="Онлайн" />
        )}
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

      {showStarred && (
        <div className="starred-panel">
          <div className="starred-header">
            <span>⭐ Избранные сообщения</span>
            <button className="btn-close-starred" onClick={() => setShowStarred(false)}>✕</button>
          </div>
          <div className="starred-messages">
            {messages.filter(m => m.starred).length === 0 ? (
              <div className="starred-empty">Нет избранных сообщений</div>
            ) : (
              messages.filter(m => m.starred).map(m => (
                <div key={m.id} className="starred-item" onClick={() => {
                  // Прокрутка к сообщению
                  const el = document.getElementById(`msg-${m.id}`);
                  el?.scrollIntoView({ behavior: "smooth" });
                  setShowStarred(false);
                }}>
                  <span className="starred-text">{m.text.substring(0, 50)}{m.text.length > 50 ? "..." : ""}</span>
                  <span className="starred-time">{formatTime(m.createdAt)}</span>
                </div>
              ))
            )}
          </div>
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
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
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
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
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
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
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
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
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
                  onMouseDown={(e) => handleLongPress(e, m)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={(e) => handleLongPress(e, m)}
                  onTouchEnd={handlePressEnd}
                >
                  {!mine && <span className="msg-avatar">{contact.avatar}</span>}
                  <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                    {replyTo?.id === m.id && (
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px', padding: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                        💬 Ответ: {replyTo.text.substring(0, 50)}
                      </div>
                    )}
                    <span className="msg-text">{m.text}</span>
                    <div className="msg-meta">
                      <span className="msg-time">{formatTime(m.createdAt)}</span>
                    </div>
                    {/* Reactions */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {Object.entries(m.reactions).map(([emoji, uids]) => (
                          <span
                            key={emoji}
                            style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              background: uids.includes(user?.uid || '') ? 'var(--accent)' : 'rgba(0,0,0,0.2)',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setShowReactions({ visible: true, messageId: m.id })}
                          >
                            {emoji} {uids.length}
                          </span>
                        ))}
                      </div>
                    )}
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

      {/* Pinned Messages Panel */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="starred-panel">
          <div className="starred-header">
            <span>📌 Закреплённые сообщения ({pinnedMessages.length})</span>
            <button className="btn-close-starred" onClick={() => setShowPinned(false)}>✕</button>
          </div>
          <div className="starred-messages">
            {pinnedMessages.map(m => (
              <div key={m.id} className="starred-item" onClick={() => {
                const el = document.getElementById(`msg-${m.id}`);
                el?.scrollIntoView({ behavior: "smooth" });
                setShowPinned(false);
              }}>
                <span className="starred-text">📌 {m.text.substring(0, 50)}{m.text.length > 50 ? "..." : ""}</span>
                <span className="starred-time">{formatTime(m.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div style={{ padding: '8px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>📎 Прикреплено файлов: {attachedFiles.length}</span>
            <button onClick={() => setAttachedFiles([])} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px' }}>✕ Очистить</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {attachedFiles.map((file, i) => (
              <div key={i} style={{ minWidth: '80px', padding: '8px', background: 'var(--bg3)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px' }}>{file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎬' : file.type.startsWith('audio/') ? '🎵' : '📄'}</span>
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="modal-overlay"
          onClick={closeContextMenu}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
        >
          <div
            className="modal-card"
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              maxWidth: '250px',
              padding: '8px',
              background: 'var(--bg2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="delete-menu-item"
              onClick={() => handlePinMessage(contextMenu.messageId)}
              style={{ width: '100%', padding: '10px', textAlign: 'left' }}
            >
              📌 Закрепить
            </button>
            <button
              className="delete-menu-item"
              onClick={() => {
                const msg = messages.find(m => m.id === contextMenu.messageId);
                if (msg) handleReply(msg);
              }}
              style={{ width: '100%', padding: '10px', textAlign: 'left' }}
            >
              💬 Ответить
            </button>
            <button
              className="delete-menu-item"
              onClick={() => setShowReactions({ visible: true, messageId: contextMenu.messageId })}
              style={{ width: '100%', padding: '10px', textAlign: 'left' }}
            >
              😊 Реакции
            </button>
            <button
              className="delete-menu-item"
              onClick={() => handleForward(messages.find(m => m.id === contextMenu.messageId)!)}
              style={{ width: '100%', padding: '10px', textAlign: 'left' }}
            >
              ➤ Переслать
            </button>
            <button
              className="delete-menu-item"
              onClick={() => handleStar(contextMenu.messageId)}
              style={{ width: '100%', padding: '10px', textAlign: 'left' }}
            >
              ⭐ В избранное
            </button>
            <button
              className="delete-menu-item delete-danger"
              onClick={() => handleDelete(contextMenu.messageId)}
              style={{ width: '100%', padding: '10px', textAlign: 'left', color: 'var(--red)' }}
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      )}

      {/* Reactions Picker */}
      {showReactions && (
        <div
          className="modal-overlay"
          onClick={() => setShowReactions(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001 }}
        >
          <div
            className="modal-card"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '12px',
              background: 'var(--bg2)',
              borderRadius: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '300px' }}>
              {['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '✨'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(showReactions.messageId, emoji)}
                  style={{
                    fontSize: '28px',
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Settings Modal */}
      {showChatSettings && (
        <div
          className="modal-overlay"
          onClick={() => setShowChatSettings(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setShowChatSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>⚙️ Настройки чата</h3>
              </div>
              <button className="modal-close" onClick={() => setShowChatSettings(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase' }}>Название чата</label>
                <input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase' }}>Описание</label>
                <textarea
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px' }}>📢 Это канал</span>
                <button
                  onClick={() => setIsChannel(!isChannel)}
                  style={{
                    padding: '8px 16px',
                    background: isChannel ? 'var(--accent)' : 'var(--surface2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {isChannel ? 'Вкл' : 'Выкл'}
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px' }}>⏳ Исчезающие сообщения</span>
                <button
                  onClick={() => setDisappearingMessages(!disappearingMessages)}
                  style={{
                    padding: '8px 16px',
                    background: disappearingMessages ? 'var(--accent)' : 'var(--surface2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {disappearingMessages ? 'Вкл' : 'Выкл'}
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  className="settings-btn-save"
                  onClick={calculateStats}
                  style={{ flex: 1 }}
                >
                  📊 Статистика
                </button>
                <button
                  className="settings-btn-save"
                  onClick={exportChat}
                  style={{ flex: 1 }}
                >
                  💾 Экспорт
                </button>
                <button
                  className="settings-btn-cancel"
                  onClick={() => setShowChatSettings(false)}
                  style={{ flex: 1 }}
                >
                  Отмена
                </button>
                <button
                  className="settings-btn-save"
                  onClick={saveChatSettings}
                  style={{ flex: 1 }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Stats Modal */}
      {showStats && (
        <div className="modal-overlay" onClick={() => setShowStats(false)}>
          <div className="modal-card" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>📊 Статистика чата</h3>
              <button className="modal-close" onClick={() => setShowStats(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>{chatStats.total}</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Всего сообщений</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '16px', background: 'var(--bubble-mine)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{chatStats.mine}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Ваши</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bubble-theirs)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>{chatStats.theirs}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Собеседника</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      <form className="chat-input-bar" onSubmit={(e) => {
        e.preventDefault();
        if (editingMessage) {
          saveEditMessage();
        } else {
          sendText(e);
        }
      }} onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          sendText(e);
        }
      }}>
        {replyTo && (
          <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>💬 Ответ</span>: {replyTo.text.substring(0, 50)}{replyTo.text.length > 50 ? '...' : ''}
            </div>
            <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}
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
