import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [현재 키 유지] 사용자님의 키입니다.
const apiKey = "AIzaSyDKxCRIJBraZs-lU-j8KbQCc_Qk4tzIcNg";

const genAI = new GoogleGenerativeAI(apiKey);

// [핵심] 우리가 시도할 모든 모델 리스트 (하나라도 걸려라!)
const MODEL_CANDIDATES = [
  "gemini-1.5-flash",       // 1순위: 표준
  "gemini-1.5-flash-001",   // 2순위: 구버전
  "gemini-1.5-flash-8b",    // 3순위: 최신 경량 (성공 확률 높음)
  "gemini-1.5-pro",         // 4순위: 고성능
  "gemini-pro",             // 5순위: 구형
  "gemini-2.0-flash-exp"    // 6순위: 실험용
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

  // [무한 도전 로직] 모델 리스트를 돌면서 성공할 때까지 시도합니다.
  for (const modelName of MODEL_CANDIDATES) {
    console.log(`🔄 [자동전환] ${modelName} 모델로 문을 두드리는 중...`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response");

      // 성공하면 여기서 멈춤!
      console.log(`✅ [성공!] ${modelName} 모델이 응답했습니다!`);
      
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
      console.warn(`❌ [실패] ${modelName} 막힘. 다음 모델로 넘어갑니다.`);
      continue; // 포기하지 않고 다음 모델로!
    }
  }

  throw new Error("모든 AI 모델 연결에 실패했습니다.");
};
