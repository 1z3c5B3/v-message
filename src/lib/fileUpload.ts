import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
  path: string;
}

export async function uploadFile(file: File, userId: string): Promise<UploadedFile> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const path = `users/${userId}/files/${timestamp}_${randomId}_${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    url,
    name: file.name,
    type: file.type,
    size: file.size,
    path,
  };
}

export async function uploadAudio(blob: Blob, userId: string): Promise<UploadedFile> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = blob.type.includes("webm") ? "webm" : "m4a";
  const path = `users/${userId}/voice/${timestamp}_${randomId}.${extension}`;
  const storageRef = ref(storage, path);

  const file = new File([blob], `voice_${timestamp}.${extension}`, { type: blob.type });
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    url,
    name: `Голосовое сообщение`,
    type: blob.type,
    size: blob.size,
    path,
  };
}

export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Масштабирование
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Нет контекста canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Ошибка сжатия"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
    img.src = URL.createObjectURL(file);
  });
}

export async function generateVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 1; // Берём кадр на 1 секунде
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            resolve(blob);
            URL.revokeObjectURL(video.src);
          },
          "image/jpeg",
          0.7
        );
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      resolve(null);
    };
  });
}

export async function deleteFile(path: string): Promise<void> {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef).catch(() => {});
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
