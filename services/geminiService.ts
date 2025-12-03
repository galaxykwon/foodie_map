import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [★필수] 방금 '시크릿 모드'에서 새로 받은 깨끗한 키를 넣어주세요.
const apiKey = "AIzaSyD3pkGps6NfXeuwvRqHpJVKqamxEOfGAKY";

const genAI = new GoogleGenerativeAI(apiKey);

// 시도할 모델 순서 (성공률 높은 순)
// 1. 8b: 최신 경량 모델 (제일 빠르고 제한 적음)
// 2. flash: 표준 모델
// 3. pro: 고성능 모델
const MODELS_TO_TRY = [
  "gemini-1.5-flash-8b", 
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-pro"
];

function cleanAndParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) return JSON.parse(jsonMatch[1]);
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1]) return JSON.parse(codeMatch[1]);
    throw new Error("Failed to parse JSON");
  }
}

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  const prompt = `
    Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon.
    Output strictly a JSON object with a key "restaurants".
    Each item must have: "name", "category", "distance", "aiRating", "aiSummary", "keywords", "address".
    Ensure valid JSON inside a code block.
  `;

  // [스마트 로직] 될 때까지 모델을 바꿔가며 시도합니다.
  for (const modelName of MODELS_TO_TRY) {
    console.log(`🔄 [AI연결시도] ${modelName} 모델로 접속 중...`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response");

      console.log(`✅ [AI연결성공] ${modelName} 모델이 데이터를 가져왔습니다!`);
      
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

    } catch (error: any) {
      console.warn(`⚠️ [실패] ${modelName} 응답 없음. 다음 모델로 전환합니다. (에러: ${error.message})`);
      // 여기서 에러를 던지지 않고, 다음 루프(다음 모델)로 넘어갑니다.
      continue;
    }
  }

  // 모든 모델이 다 실패했을 경우 (정말 키 문제일 때만 발생)
  throw new Error("모든 AI 모델이 응답하지 않습니다. API 키를 새로 발급받아주세요.");
};
