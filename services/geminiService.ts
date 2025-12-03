import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [인증] 사용자님의 새 키 유지 (...IcNg)
const apiKey = "AIzaSyDKxCRIJBraZs-lU-j8KbQCc_Qk4tzIcNg";

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
  // [★확인용★] 이 로그가 떠야 진짜 배포된 겁니다!
  console.log("🚀 [클래식] gemini-pro (1.0) 모델로 변경됨!");

  // [수정] 최신 모델들이 404/429로 불안정하니, 가장 근본적인 'gemini-pro'를 사용합니다.
  // 개인 계정이라면 이 모델은 100% 작동해야 정상입니다.
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
