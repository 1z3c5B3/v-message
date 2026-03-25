/**
 * Cloud Functions для V-Message
 * Отправка push-уведомлений при сообщениях и звонках
 */

import * as admin from "firebase-admin";
import { firestore } from "firebase-functions/v1";

// Инициализация Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Отправка уведомления при новом сообщении
 */
export const onMessageCreated = firestore
  .document("conversations/{convoId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    try {
      const messageData = snap.data();

      // Получаем ID отправителя
      const senderId = messageData.uid;
      if (!senderId) {
        console.log("Нет senderId");
        return;
      }

      // Получаем ID получателя из conversation ID
      const convoParts = context.params.convoId?.split("_") || [];
      const recipientId = convoParts.find((id: string) => id !== senderId);

      if (!recipientId) {
        console.log("Нет recipientId");
        return;
      }

      // Получаем данные отправителя
      const senderSnap = await db.collection("users").doc(senderId).get();
      const senderData = senderSnap.data();
      const senderName = senderData?.username || "Пользователь";

      // Получаем FCM токены получателя
      const recipientSnap = await db.collection("users").doc(recipientId).get();
      const recipientData = recipientSnap.data();

      if (!recipientData) {
        console.log("Получатель не найден:", recipientId);
        return;
      }

      // Собираем все токены
      const tokenList: string[] = [];
      if (recipientData.fcmToken) {
        tokenList.push(recipientData.fcmToken);
      }
      if (recipientData.fcmTokens) {
        Object.keys(recipientData.fcmTokens).forEach((token) => {
          if (!tokenList.includes(token)) tokenList.push(token);
        });
      }

      if (tokenList.length === 0) {
        console.log("У получателя нет FCM токенов");
        return;
      }

      // Формируем текст уведомления в зависимости от типа сообщения
      let bodyText = messageData.text?.substring(0, 100) || "Новое сообщение";
      if (messageData.type === "sticker") {
        bodyText = "📸 Стикер";
      } else if (messageData.type === "image") {
        bodyText = "📷 Фото";
      } else if (messageData.type === "file") {
        bodyText = `📎 Файл: ${messageData.fileName || "Файл"}`;
      } else if (messageData.type === "voice") {
        bodyText = "🎤 Голосовое сообщение";
      } else if (messageData.type === "video") {
        bodyText = "🎬 Видео";
      }

      // Формируем уведомление
      const notification: admin.messaging.MulticastMessage = {
        notification: {
          title: senderName,
          body: bodyText,
        },
        data: {
          type: "message",
          chatId: senderId,
          chatName: senderName,
          url: "/",
          tag: `message-${context.params.messageId}`
        },
        tokens: tokenList.slice(0, 10) // Ограничим 10 токенами
      };

      // Отправляем уведомление
      const response = await admin.messaging().sendEachForMulticast(notification);
      console.log(`Отправлено ${response.successCount}/${tokenList.length} уведомлений`);
      
      // Обрабатываем неудачные токены
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(`Токен не доставлен: ${tokenList[idx]} - ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      console.error("Ошибка в onMessageCreated:", error);
    }
  });

/**
 * Отправка уведомления о входящем звонке
 */
export const onCallCreated = firestore
  .document("calls/{callId}")
  .onCreate(async (snap, context) => {
    try {
      const callData = snap.data();
      const recipientId = callData.callee; // ID получателя звонка
      const senderId = callData.caller; // ID звонящего
      const callType = callData.type || "video"; // voice или video

      if (!recipientId || !senderId) {
        console.log("Нет recipientId или senderId");
        return;
      }

      // Не отправлять уведомление если это не статус "calling"
      if (callData.status !== "calling") {
        console.log("Статус звонка не 'calling'");
        return;
      }

      // Получаем данные звонящего
      const senderSnap = await db.collection("users").doc(senderId).get();
      const senderData = senderSnap.data();
      const senderName = senderData?.username || "Пользователь";

      // Получаем FCM токены получателя
      const recipientSnap = await db.collection("users").doc(recipientId).get();
      const recipientData = recipientSnap.data();

      if (!recipientData) {
        console.log("Получатель не найден:", recipientId);
        return;
      }

      // Собираем все токены
      const tokenList: string[] = [];
      if (recipientData.fcmToken) {
        tokenList.push(recipientData.fcmToken);
      }
      if (recipientData.fcmTokens) {
        Object.keys(recipientData.fcmTokens).forEach((token) => {
          if (!tokenList.includes(token)) tokenList.push(token);
        });
      }

      if (tokenList.length === 0) {
        console.log("У получателя нет FCM токенов");
        return;
      }

      // Формируем уведомление о звонке с ВЫСОКИМ приоритетом
      const notification: admin.messaging.MulticastMessage = {
        notification: {
          title: `📞 ${callType === "video" ? "Видеозвонок" : "Звонок"} от ${senderName}`,
          body: "Нажмите, чтобы ответить",
        },
        // Android: высокий приоритет для работы в фоне
        android: {
          priority: "high",
          notification: {
            channelId: "calls",
            sound: "default",
            icon: "notification_icon",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
          ttl: 30000, // 30 секунд жизни
          collapseKey: "call",
        },
        // iOS: будит приложение
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-collapse-id": `call-${context.params.callId}`,
          },
          payload: {
            aps: {
              sound: {
                name: "default",
                volume: 1.0,
              },
              contentAvailable: true,
              mutableContent: true,
              category: "CALL_INVITATION",
            },
          },
        },
        data: {
          type: "call",
          callId: context.params.callId,
          from: senderId,
          fromName: senderName,
          callType: callType,
          url: "/",
          tag: `call-${context.params.callId}`,
          // Для Android
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens: tokenList.slice(0, 10)
      };

      const response = await admin.messaging().sendEachForMulticast(notification);
      console.log(`Отправлено ${response.successCount}/${tokenList.length} уведомлений о звонке`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(`Токен не доставлен: ${tokenList[idx]} - ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      console.error("Ошибка в onCallCreated:", error);
    }
  });

/**
 * Отправка уведомления при изменении статуса звонка
 */
export const onCallUpdated = firestore
  .document("calls/{callId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Если звонок завершён, отправляем уведомление
      if (after.status === "ended" && before.status !== "ended") {
        const recipientId = after.callee;
        const senderId = after.caller;

        if (!recipientId || !senderId) {
          console.log("Нет recipientId или senderId");
          return;
        }

        const senderSnap = await db.collection("users").doc(senderId).get();
        const senderData = senderSnap.data();
        const senderName = senderData?.username || "Пользователь";

        const recipientSnap = await db.collection("users").doc(recipientId).get();
        const recipientData = recipientSnap.data();

        if (!recipientData) {
          console.log("Получатель не найден:", recipientId);
          return;
        }

        // Собираем все токены
        const tokenList: string[] = [];
        if (recipientData.fcmToken) {
          tokenList.push(recipientData.fcmToken);
        }
        if (recipientData.fcmTokens) {
          Object.keys(recipientData.fcmTokens).forEach((token) => {
            if (!tokenList.includes(token)) tokenList.push(token);
          });
        }

        if (tokenList.length === 0) {
          console.log("У получателя нет FCM токенов");
          return;
        }

        const notification: admin.messaging.MulticastMessage = {
          notification: {
            title: `${senderName} завершил(а) звонок`,
            body: "Нажмите, чтобы открыть чат",
          },
          data: {
            type: "call-ended",
            callId: context.params.callId,
            url: "/",
            tag: `call-ended-${context.params.callId}`
          },
          tokens: tokenList.slice(0, 10)
        };

        const response = await admin.messaging().sendEachForMulticast(notification);
        console.log(`Отправлено ${response.successCount}/${tokenList.length} уведомлений о завершении звонка`);
      }
    } catch (error) {
      console.error("Ошибка в onCallUpdated:", error);
    }
  });
