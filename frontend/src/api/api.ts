// src/api/api.ts
export const BASE_URL = "https://www.unlimcode.com/api";
export interface GPTRequest {
  prompt: string;
}

export interface GPTResponse {
  response: string;
}

export const askGPT = async (data: GPTRequest): Promise<GPTResponse> => {
  const res = await fetch(`${BASE_URL}/gpt/ask`, {
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
