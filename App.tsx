import React, { useState, useEffect, useCallback } from 'react';
import { fetchRestaurants } from './services/geminiService';
import { Restaurant, UserReview, Category, SearchState } from './types';
import RestaurantCard from './components/RestaurantCard';
import ReviewModal from './components/ReviewModal';

const App: React.FC = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    loading: true,
    error: null,
    data: [],
    timestamp: 0,
  });

  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetName, setReviewTargetName] = useState('');

  // Initial Load
  useEffect(() => {
    loadData();
    loadUserReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserReviews = () => {
    const saved = localStorage.getItem('nrf_gourmet_reviews');
    if (saved) {
      try {
        setUserReviews(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse reviews", e);
      }
    }
  };

  const loadData = useCallback(async () => {
    // Basic caching strategy: If data exists and is less than 1 hour old, don't re-fetch
    // However, for this demo, we'll allow re-fetching via a button, but auto-load once.
    
    setSearchState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // In a real app, we might check localStorage cache here too to save API tokens
      const results = await fetchRestaurants();
      setSearchState({
        loading: false,
        error: null,
        data: results,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: "정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      }));
    }
  }, []);

  const handleAddReview = (name: string) => {
    setReviewTargetName(name);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = (review: UserReview) => {
    const updatedReviews = [...userReviews, review];
    setUserReviews(updatedReviews);
    localStorage.setItem('nrf_gourmet_reviews', JSON.stringify(updatedReviews));
  };

  // Filter Logic
  const filteredRestaurants = searchState.data
    .filter(r => selectedCategory === Category.ALL || r.category === selectedCategory)
    .sort((a, b) => {
      // Sort logic: Combine AI rating with user rating count/score for ranking
      // For simplicity: Sort by AI rating descending
      return b.aiRating - a.aiRating;
    });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                한국연구재단 <span className="text-blue-600">맛집 지도</span>
              </h1>
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              대전청사 & 연구단지 점심 가이드
            </div>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="border-t border-gray-100 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 h-12 items-center">
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedCategory === cat
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro / Status */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory} 리스트 ({filteredRestaurants.length})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              자차 15분 이내, 블로그 및 지도 리뷰 기반 AI 추천
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={searchState.loading}
            className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
          >
            {searchState.loading ? '분석 중...' : '목록 새로고침'}
          </button>
        </div>

        {/* Loading State */}
        {searchState.loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium animate-pulse">
              AI가 주변 맛집 리뷰를 분석하고 있습니다...
            </p>
            <p className="text-xs text-gray-400">네이버/카카오/티스토리 리뷰 통합 중</p>
          </div>
        )}

        {/* Error State */}
        {searchState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
            <p className="font-bold mb-2">오류가 발생했습니다</p>
            <p>{searchState.error}</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* List Grid */}
        {!searchState.loading && !searchState.error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                data={restaurant}
                userReviews={userReviews}
                onAddReview={handleAddReview}
              />
            ))}
            
            {filteredRestaurants.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                해당 카테고리의 맛집 정보를 찾지 못했습니다.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>© 2024 NRF Gourmet Map. Powered by Google Gemini.</p>
          <p className="mt-2">본 서비스는 AI를 활용하여 외부 리뷰를 요약한 정보이며, 실제와 다를 수 있습니다.</p>
        </div>
      </footer>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        restaurantName={reviewTargetName}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default App;