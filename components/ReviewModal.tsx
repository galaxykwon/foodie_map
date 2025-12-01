import React, { useState } from 'react';
import { UserReview } from '../types';

interface ReviewModalProps {
  restaurantName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: UserReview) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ restaurantName, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: UserReview = {
      id: Date.now().toString(),
      restaurantName,
      rating,
      comment,
      date: new Date().toLocaleDateString(),
    };
    onSubmit(newReview);
    setComment('');
    setRating(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-blue-600 p-4">
          <h3 className="text-white text-lg font-bold truncate">리뷰 작성: {restaurantName}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl focus:outline-none transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">한줄평</label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24"
              placeholder="맛, 분위기, 서비스에 대한 솔직한 후기를 남겨주세요."
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;