// Netlify Function для уведомлений о звонках
import axios from 'axios';

const ONE_SIGNAL_APP_ID = "e3edb60b-2480-4bf5-8268-826cfb3799c7";
const ONE_SIGNAL_API_KEY = "os_v2_app_4pw3mczeqbf7latiqjwpwn4zy5jxdmqvccnubenplc4m2zac4ilrhpro5sm3rtg4ewuhnfxmvkuutqpoaykyq6uvqzrtpdslier4wpq";

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { userId, callerName, callType, callId } = JSON.parse(event.body);

    // Отправка уведомления о звонке
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONE_SIGNAL_APP_ID,
        include_external_user_ids: [userId],
        headings: { 
          en: callType === "video" ? "📞 Видеозвонок" : "📞 Звонок"
        },
        contents: { 
          en: `Входящий звонок от ${callerName}`
        },
        data: {
          type: "call",
          callId: callId,
          url: "/"
        },
        android_channel_id: "calls",
        ios_sound: "default",
        android_sound: "default"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${ONE_SIGNAL_API_KEY}`
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, response: response.data })
    };
  } catch (error) {
    console.error("Error sending call notification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
