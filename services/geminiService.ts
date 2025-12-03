import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [현재 키 유지]
const apiKey = "AIzaSyDKxCRIJBraZs-lU-j8KbQCc_Qk4tzIcNg";

const genAI = new GoogleGenerativeAI(apiKey);

// 시도해볼 모델 리스트 (우선순위 순서)
const MODEL_CANDIDATES = [
  "gemini-1.5-flash",       // 1순위: 가장 빠르고 무료 (현재 404?)
  "gemini-1.5-flash-001",   // 2순위: 버전 명시 (404 해결용)
  "gemini-1.5-flash-002",   // 3순위: 최신 버전
  "gemini-1.5-pro",         // 4순위: 고성능 (1.5)
  "gemini-pro",             // 5순위: 구형 (1.0) - 호환성 최강
  "gemini-1.5-flash-8b"     // 6순위: 초경량
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

  // [핵심] 모델을 하나씩 돌아가며 시도하는 반복문
  for (const modelName of MODEL_CANDIDATES) {
    console.log(`🔄 시도 중: ${modelName} 모델로 연결 시도...`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response");

      // 성공하면 바로 여기서 데이터 반환하고 끝냄 (return)
      console.log(`✅ 성공! ${modelName} 모델이 응답했습니다.`);
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
      // 실패하면 에러를 찍고 다음 모델로 넘어갑니다.
      console.warn(`❌ 실패: ${modelName} 안 됨. (${error.message}) -> 다음 모델 검색`);
      continue; // 다음 루프로!
    }
  }

  // 모든 모델이 다 실패했을 때만 에러 발생
  throw new Error("모든 AI 모델 연결에 실패했습니다. API 키를 새로 발급받아야 할 수도 있습니다.");
};
