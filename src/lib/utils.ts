// Дополнительные функции для V-Message

// 1. Звук уведомления
export function playNotificationSound(type: 'message' | 'call' = 'message') {
  const sounds = {
    message: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
    call: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

// 2. Проверка тихих часов
export function isQuietHours(startHour: number = 22, endHour: number = 8): boolean {
  const currentHour = new Date().getHours();
  return currentHour >= startHour || currentHour <= endHour;
}

// 3. Генерация QR кода (текстовый)
export function generateQRCode(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

// 4. Форматирование упоминания
export function formatMention(username: string): string {
  return `@${username}`;
}

// 5. Парсинг упоминаний из текста
export function parseMentions(text: string): string[] {
  const mentions = text.match(/@\w+/g) || [];
  return mentions;
}

// 6. Экспорт в JSON
export function exportToJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 7. Импорт из JSON
export function importFromJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 8. Сжатие видео (базовое)
export async function compressVideo(file: File, maxWidth = 1280, maxHeight = 720): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadeddata = () => {
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Нет контекста'));
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Ошибка сжатия'));
        },
        'video/webm',
        0.7
      );
    };
    
    video.onerror = () => reject(new Error('Ошибка видео'));
  });
}

// 9. Вставка из буфера
export async function pasteFromClipboard(): Promise<Blob | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.some(type => type.startsWith('image/'))) {
        return await item.getType(item.types.find(type => type.startsWith('image/'))!);
      }
    }
  } catch (err) {
    console.error('Ошибка чтения буфера:', err);
  }
  return null;
}

// 10. Проверка жестов (свайп)
export function detectSwipe(
  startX: number,
  endX: number,
  threshold: number = 50
): 'left' | 'right' | null {
  const diff = startX - endX;
  if (Math.abs(diff) > threshold) {
    return diff > 0 ? 'left' : 'right';
  }
  return null;
}

// 11. Генерация кода подтверждения
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 12. Проверка кода
export function verifyCode(code: string, expected: string): boolean {
  return code === expected;
}
