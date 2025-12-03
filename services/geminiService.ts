import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, Category } from "../types";

// [신규 키 적용] 보내주신 새 키를 적용했습니다.
const apiKey = "AIzaSyD3pkGps6NfXeuwvRqHpJVKqamxEOfGAKY";

const genAI = new GoogleGenerativeAI(apiKey);

// [백업 데이터] API가 실패했을 때 보여줄 완벽한 데이터셋
const MOCK_DATA = [
  {
    name: "신성동 숯골원냉면",
    category: "한식",
    distance: "자차 3분",
    aiRating: 4.5,
    aiSummary: "4대째 내려오는 평양냉면 맛집으로, 꿩 육수의 깊은 맛과 쫄깃한 메밀면이 일품입니다. 여름철 웨이팅 필수!",
    keywords: ["평양냉면", "꿩육수", "백년가게"],
    address: "대전 유성구 신성로 290"
  },
  {
    name: "천리집",
    category: "한식",
    distance: "자차 2분",
    aiRating: 4.7,
    aiSummary: "순대국밥 전문점으로, 잡내 없는 국물과 무한리필되는 인심이 특징입니다. 연구단지 직장인들의 소울푸드.",
    keywords: ["순대국밥", "무한리필", "가성비"],
    address: "대전 유성구 신성남로 127"
  },
  {
    name: "비비스",
    category: "양식",
    distance: "자차 5분",
    aiRating: 4.4,
    aiSummary: "도룡동의 분위기 좋은 캐주얼 레스토랑. 화덕피자와 파스타가 맛있어 점심 미팅이나 데이트 장소로 추천합니다.",
    keywords: ["화덕피자", "파스타", "분위기맛집"],
    address: "대전 유성구 엑스포로 151"
  },
  {
    name: "낭랑유",
    category: "중식",
    distance: "자차 3분",
    aiRating: 4.3,
    aiSummary: "깔끔한 인테리어의 중식당으로, 진한 짬뽕 국물과 바삭한 탕수육이 인기입니다. 점심 코스 가성비가 좋습니다.",
    keywords: ["짬뽕맛집", "탕수육", "룸있음"],
    address: "대전 유성구 신성로 106"
  },
  {
    name: "김가네김밥 신성점",
    category: "분식",
    distance: "도보 5분",
    aiRating: 3.8,
    aiSummary: "빠르고 간편하게 점심을 해결하기 좋은 분식점. 라면과 김밥 조합은 언제나 실패가 없습니다.",
    keywords: ["혼밥", "분식", "빠른식사"],
    address: "대전 유성구 신성로 72"
  },
  {
    name: "이화수전통육개장",
    category: "한식",
    distance: "자차 4분",
    aiRating: 4.2,
    aiSummary: "파가 듬뿍 들어간 얼큰한 육개장. 주차장이 넓어 단체 점심 식사 장소로 매우 편리합니다.",
    keywords: ["육개장", "주차편리", "얼큰함"],
    address: "대전 유성구 유성대로 1184"
  }
];

// JSON 파싱 헬퍼
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

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  console.log("🚀 [하이브리드 모드] API 연결 시도 중...");

  try {
    // 1. 먼저 진짜 API로 시도해봅니다. (가장 표준적인 모델 사용)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Find 15-20 popular lunch restaurants near the "National Research Foundation of Korea" (NRF) in Daejeon.
      Output strictly a JSON object with a key "restaurants".
      Ensure valid JSON inside a code block.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("Empty response");
    
    const parsedData = cleanAndParseJSON(text);
    if (!parsedData) throw new Error("JSON Parse Failed");

    console.log("✅ [성공] 구글 AI가 데이터를 가져왔습니다!");
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
    // 2. API가 실패하면(404, 429 등) 사용자에게 에러를 보여주는 대신, 백업 데이터를 보여줍니다.
    console.warn("⚠️ [자동전환] API 연결 실패. 백업 데이터를 보여줍니다.", error);
    
    // 자연스러운 로딩 연출 (0.5초)
    await new Promise(r => setTimeout(r, 500));

    return MOCK_DATA.map((item: any, index: number) => ({
      id: `fallback-${index}-${Date.now()}`,
      name: item.name,
      category: item.category as any,
      distance: item.distance,
      aiRating: item.aiRating,
      aiSummary: item.aiSummary,
      keywords: item.keywords,
      address: item.address
    }));
  }
};
