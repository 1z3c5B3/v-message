// Netlify Function для отправки OneSignal уведомлений
import axios from 'axios';

const ONE_SIGNAL_APP_ID = "e3edb60b-2480-4bf5-8268-826cfb3799c7";
const ONE_SIGNAL_API_KEY = "os_v2_app_4pw3mczeqbf7latiqjwpwn4zy5jxdmqvccnubenplc4m2zac4ilrhpro5sm3rtg4ewuhnfxmvkuutqpoaykyq6uvqzrtpdslier4wpq";

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { userId, title, message, type } = JSON.parse(event.body);

    // Отправка уведомления через OneSignal API
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONE_SIGNAL_APP_ID,
        include_external_user_ids: [userId],
        headings: { en: title },
        contents: { en: message },
        data: {
          type: type,
          url: "/"
        }
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
    console.error("Error sending notification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
