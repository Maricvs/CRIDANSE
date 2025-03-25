// src/api/api.ts
export const BASE_URL = "https://www.unlimcode.com";


export interface GPTRequest {
  prompt: string;
  user_id: number;   // 🆕 нужен для истории
  chat_id: number;   // 🆕 нужен для истории
}

export const askGPT = async (data: GPTRequest): Promise<GPTResponse> => {
  const res = await fetch(`${BASE_URL}/api/gpt/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка запроса: ${res.status} - ${errorText}`);
  }

  return res.json();
};
