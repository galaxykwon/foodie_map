import React from 'react';
import { Restaurant, UserReview } from '../types';

interface RestaurantCardProps {
  data: Restaurant;
  userReviews: UserReview[];
  onAddReview: (name: string) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ data, userReviews, onAddReview }) => {
  const relevantReviews = userReviews.filter(r => r.restaurantName === data.name);
  
  // Calculate combined rating
  const userRatingSum = relevantReviews.reduce((sum, r) => sum + r.rating, 0);
  const userRatingAvg = relevantReviews.length > 0 ? userRatingSum / relevantReviews.length : 0;
  
  // Display rating logic: if user reviews exist, average them with AI rating. Else show AI rating.
  const displayRating = relevantReviews.length > 0 
    ? ((data.aiRating + userRatingAvg) / 2).toFixed(1) 
    : data.aiRating.toFixed(1);

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case '한식': return 'bg-orange-100 text-orange-800 border-orange-200';
      case '중식': return 'bg-red-100 text-red-800 border-red-200';
      case '양식': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '분식': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const mapLink = `https://map.naver.com/v5/search/${encodeURIComponent(data.name + ' 대전')}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border mb-1 ${getCategoryColor(data.category)}`}>
              {data.category}
            </span>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              <a href={mapLink} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                {data.name}
              </a>
            </h3>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center bg-blue-50 px-2 py-1 rounded-lg">
              <span className="text-yellow-500 text-sm mr-1">★</span>
              <span className="font-bold text-blue-900">{displayRating}</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">{data.distance}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
          <span className="font-semibold text-blue-600">AI 요약: </span>
          {data.aiSummary}
        </p>

        <div className="mt-4 flex flex-wrap gap-1">
          {data.keywords.map((kw, idx) => (
            <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 border-t border-gray-100">
        {relevantReviews.length > 0 ? (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">최신 연구원 리뷰</p>
            <div className="text-sm text-gray-700 italic border-l-2 border-blue-300 pl-2">
              "{relevantReviews[relevantReviews.length - 1].comment}"
            </div>
          </div>
        ) : (
          <div className="mb-3 text-xs text-gray-400 text-center py-1">
            아직 등록된 리뷰가 없습니다.
          </div>
        )}
        
        <button
          onClick={() => onAddReview(data.name)}
          className="w-full py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-medium"
        >
          리뷰 작성하기
        </button>
      </div>
    </div>
  );
};

export default RestaurantCard;