import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [현재 키 유지]
const apiKey = "AIzaSyD3pkGps6NfXeuwvRqHpJVKqamxEOfGAKY";

const genAI = new GoogleGenerativeAI(apiKey);

// 시도할 모델 리스트 (성공 확률 높은 순)
const MODELS_TO_TRY = [
  "gemini-2.0-flash-exp",   // 1순위: 아까 429가 떴던 모델 (재시도하면 뚫릴 수 있음)
  "gemini-1.5-flash",       // 2순위: 표준
  "gemini-1.5-flash-8b",    // 3순위: 최신 경량
  "gemini-1.5-pro",         // 4순위: 고성능
  "gemini-pro"              // 5순위: 구형
];

function cleanAndParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) return JSON.parse(jsonMatch[1]);
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1]) return JSON.parse(codeMatch[1]);
    return null;
  }
}

// 429 에러 등을 대비한 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  const prompt = `
    Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon.
    Output strictly a JSON object with a key "restaurants".
    Each item must have: "name", "category", "distance", "aiRating", "aiSummary", "keywords", "address".
    Ensure valid JSON inside a code block.
  `;

  // 모델 하나씩 순서대로 시도
  for (const modelName of MODELS_TO_TRY) {
    console.log(`🔄 [REAL-TIME] ${modelName} 연결 시도...`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response");
      
      const parsedData = cleanAndParseJSON(text);
      if (!parsedData) throw new Error("JSON Parse Failed");

      console.log(`✅ [성공] ${modelName} 모델이 실시간 데이터를 가져왔습니다!`);
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
      // 429 에러(사용량 초과)가 뜨면 한 번 더 기회를 줍니다.
      if (error.message && error.message.includes("429")) {
        console.warn(`⏳ [대기] ${modelName} 사용량 많음. 3초 후 재시도...`);
        await delay(3000); // 3초 대기
        try {
          // 재시도 로직
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          const parsedData = cleanAndParseJSON(text);
          if (parsedData) {
             console.log(`✅ [재시도 성공] ${modelName} 모델이 데이터를 가져왔습니다!`);
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
          }
        } catch (retryError) {
           console.warn(`❌ [재시도 실패] ${modelName} 포기.`);
        }
      }
      
      console.warn(`❌ [실패] ${modelName} 안됨. 다음 모델로 넘어갑니다.`);
      continue;
    }
  }

  // 모든 모델이 실패하면 에러를 띄웁니다 (백업 데이터 없음)
  throw new Error("모든 AI 모델 연결에 실패했습니다. (API 키 권한 또는 사용량 문제)");
};
