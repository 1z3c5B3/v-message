import { useState, useRef, useCallback } from "react";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Проверка поддержки API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Ваш браузер не поддерживает запись аудио");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Таймер для отображения времени записи
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Ошибка доступа к микрофону:", err);
      
      // Более подробные сообщения об ошибках
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Доступ к микрофону запрещён. Разрешите в настройках браузера");
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error("Микрофон не найден. Подключите микрофон");
      }
      if (err.name === "NotReadableError") {
        throw new Error("Микрофон занят другим приложением");
      }
      if (err.name === "SecurityError") {
        throw new Error("Требуется HTTPS соединение для доступа к микрофону");
      }
      throw new Error(err.message || "Нет доступа к микрофону");
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error("Не записывается"));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.type || "audio/webm",
        });

        // Останавливаем все треки
        mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsRecording(false);
        setRecordingTime(0);
        resolve(blob);
      };

      mediaRecorderRef.current.onerror = (e) => {
        reject(new Error("Ошибка записи: " + e.error));
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setRecordingTime(0);
      chunksRef.current = [];
    };

    mediaRecorderRef.current.stop();
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    chunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  };
}

export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
