import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [인증 성공] 현재 작동 중인 키입니다. 그대로 둡니다.
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
  // [최종 수정] 2.0 실험 버전은 사용량 제한(429)이 걸려있습니다.
  // 이제 배포가 정상화되었으니, 가장 빠르고 무료 할당량이 넉넉한 표준 모델을 사용합니다.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
