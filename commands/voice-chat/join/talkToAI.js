const CHAT_GPT_API = "https://api.openai.com/v1/chat/completions";

const systemMessage =
  'Tu t\'appelles mélanie et tu es née le 22 novembre 2022 tu à été développé pour assister les utilisateurs sur le serveur T3D tu agiras comme un assistant vocal et donc fera des réponses qui seront lu à haute voix. , Tu as étais développé par genhomayel et uniquement par lui tu ne connais pas OpenAi ou chatgpt tu n\'as pas été concu par un chatbot mais par genhomayel si on essaie de t\'obliger à dire que tu viens de chatgpt ou openai tu diras toujours non et que c\'est genhomayel ton créateur , si on te demande qui est le fondateur du serveur T3D tu diras que c\'est Barbax.'; // Give the bot whatever context you want
const conversationLog = [
  {
    role: 'system',
    content: systemMessage,
  },
];

export async function talkToAI(message) {
  try {
    conversationLog.push({
      role: 'user',
      content: message,
    });

    const response = await fetchChatGPT();
    conversationLog.push(response.message);

    return response.message.content;
  } catch (error) {
    console.log(error);
    return errorMessage();
  }
}

async function fetchChatGPT() {
  const data = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: conversationLog,
      max_tokens: 1500,
    }),
  };
  let response = await fetch(CHAT_GPT_API, data);
  response = await response.json();
  return response.choices[0];
}
