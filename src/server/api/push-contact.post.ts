export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  type ContactType = "question" | "work" | "etc";
  const { name, contact, subject, message, contactType, token } = body as {
    name: string;
    contact: string;
    subject: string;
    message: string;
    contactType: ContactType;
    token: string;
  };

  const typeMap: Record<ContactType, string> = {
    question: "質問",
    work: "お仕事",
    etc: "その他",
  };

  // validate
  if (!name || !contact || !subject || !message || !contactType || !token) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      body: "Bad Request",
    };
  }
  if (!Object.keys(typeMap).includes(contactType)) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      body: "Invalid contact type",
    };
  }
  if ((await verifyTurnstileToken(token || body['cf-turnstile-response'])).success !== true) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      body: "Invalid token",
    };
  }

  const config = useRuntimeConfig();
  const webhookUri: string = config.contactFormWebhookUri;

  // webhookURLが設定されていない場合はエラー
  if (!webhookUri) {
    console.error("Webhook URL is not configured");
    setResponseStatus(event, 500);
    return {
      statusCode: 500,
      body: "Webhook URL is not configured",
    };
  }

  // webhookでpush通知を送信する
  const embed = {
    content: "新しいお問い合わせがあります",
    tts: false,
    embeds: [
      {
        title: `:white_check_mark:[新着: ${typeMap[contactType]}]${contactType}`,
        color: parseInt("ff6fac", 16),
        fields: [
          {
            name: `:mailbox_with_mail: 連絡先情報`,
            value: `${name} (${contact})`,
            inline: false,
          },
          {
            name: "本文",
            value: message,
            inline: true,
          },
        ],
      },
    ],
  };
  const response = await $fetch(webhookUri, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(embed),
    ignoreResponseErrors: true,
  })
    .then(() => {
      return {
        statusCode: 200,
        body: "OK",
      };
    })
    .catch((error) => {
      console.error("Error:", error);
      setResponseStatus(event, 500);
      return {
        statusCode: 500,
        body: "Internal Server Error",
      };
    });
  return response;
});
