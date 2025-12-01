import { GoogleGenAI } from "@google/genai";
import { Restaurant, Category } from "../types";

// [수정 1] Vite 환경 변수 접근 방식 변경 + 변수명에 VITE_ 붙임
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// API 키가 없을 경우 안전 장치
if (!apiKey) {
  console.error("API Key is missing! Check your .env file or Vercel settings.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to parse JSON from markdown code blocks
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
  const prompt = `
    Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon (Sinseong-dong/Doryong-dong area).
    Constraints:
    1. Must be within a 15-minute drive from NRF.
    2. Focus on places suitable for employee lunch.
    3. Analyze recent reviews from web sources (blogs, maps) to generate a summary.
    
    Output strictly a JSON object with a key "restaurants" containing an array. 
    Each item must have:
    - "name": string (Korean name)
    - "category": string (One of: "한식", "중식", "양식", "분식", "기타")
    - "distance": string (e.g., "자차 5분" or "1.2km")
    - "aiRating": number (1.0 to 5.0, estimated based on sentiment)
    - "aiSummary": string (A concise 1-2 sentence summary of external reviews emphasizing signature dishes and atmosphere)
    - "keywords": array of strings (e.g. ["Clean", "Spicy", "Good Value"])
    - "address": string (Approximate address or area name)

    Ensure the response is valid JSON inside a code block.
  `;

  try {
    const response = await ai.models.generateContent({
      // [수정 2] 존재하는 모델명으로 변경 (2.5 -> 1.5)
      model: "gemini-1.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
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
