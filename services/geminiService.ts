import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [테스트용] API 키 직접 입력 (성공 후에는 꼭 지우세요!)
const apiKey = "AIzaSyDy7gcSLJdtfdn2zMkp6KnCzj6cUvsffBQ"; 

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
  // [★중요★] 모델 이름 뒤에 -001을 붙여야 404 에러가 사라집니다.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

  const prompt = `
    Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon (Sinseong-dong/Doryong-dong area).
    Constraints:
    1. Must be within a 15-minute drive from NRF.
    2. Focus on places suitable for employee lunch.
    3. Analyze known information to generate a summary.
    
    Output strictly a JSON object with a key "restaurants" containing an array. 
    Each item must have:
    - "name": string (Korean name)
    - "category": string (One of: "한식", "중식", "양식", "분식", "기타")
    - "distance": string (e.g., "자차 5분" or "1.2km")
    - "aiRating": number (1.0 to 5.0)
    - "aiSummary": string (A concise 1-2 sentence summary)
    - "keywords": array of strings
    - "address": string

    Ensure the response is valid JSON inside a code block.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Empty response from AI");

    const parsedData = cleanAndParseJSON(text);
    
    if (!parsedData.restaurants || !Array.isArray(parsedData.restaurants)) {
        throw new Error("Invalid data structure returned");
    }

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
