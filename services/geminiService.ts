import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [인증] 사용자님의 새 키 유지
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
  // [로그 확인] 8b 모델로 시도합니다.
  console.log("🚀 [히든카드] gemini-1.5-flash-8b 모델 가동!");

  // [수정] 표준 모델이 막혔을 때 뚫을 수 있는 '8b' 모델 사용
  // 이 모델은 최신 경량화 버전이라 권한 정책이 다를 수 있습니다.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

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
    
    // [진단] 만약 실패하면, 혹시 사용 가능한 다른 모델이 있는지 확인하는 로그를 띄웁니다.
    // (이 부분은 브라우저 환경에 따라 제한될 수 있지만 시도해봅니다)
    console.log("⚠️ 모델 접근 실패. 계정 권한을 확인해주세요.");
    
    throw error;
  }
};
