export enum Category {
  ALL = '전체',
  KOREAN = '한식',
  CHINESE = '중식',
  WESTERN = '양식',
  SNACK = '분식',
  OTHER = '기타',
}

export interface UserReview {
  id: string;
  restaurantName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: Category;
  distance: string; // e.g., "5분", "1.2km"
  aiRating: number; // 0-5
  aiSummary: string; // Summary of external reviews (Naver, Daum, etc.)
  keywords: string[];
  address?: string; // Optional inferred address
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  data: Restaurant[];
  timestamp: number;
}