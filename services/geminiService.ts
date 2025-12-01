import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [확인됨] 사용자님이 주신 새 키 그대로 사용
const apiKey = "AIzaSyDvzLRTrtHpyYdyFm3tubcoL06wqAHtZto";

const genAI = new GoogleGenerativeAI(apiKey);

// JSON 파싱 헬퍼
function cleanAndParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) return JSON.parse(jsonMatch[1]);
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1]) return JSON.parse(codeMatch[1]);
    throw new Error("Failed to parse JSON from response");
  }
}

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  // [수정] 최신 모델들이 404가 뜨므로, 가장 호환성이 좋은 'gemini-pro'를 사용합니다.
  // 이 모델은 구글 API가 켜져 있다면 무조건 작동합니다.
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon.
    Output strictly a JSON object with a key "restaurants".
    Each item must have: "name", "category", "distance", "aiRating", "aiSummary", "keywords", "address".
    Ensure valid JSON inside a code block.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Empty response from AI");

    const parsedData = cleanAndParseJSON(text);
    return parsedData.restaurants.map((item: any, index: number) => ({
      id: `gemini-${index}-${Date.now()}`,
      name: item.name,
      category: Object.values(Category).includes(item.category) ? item.category : Category.OTHER,
      distance: item.distance || "근처",
      aiRating: item.aiRating || 0,
      aiSummary: item.aiSummary || "정보 없음",
      keywords: item.keywords || [],
      address: item.address || ""
    }));
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};
