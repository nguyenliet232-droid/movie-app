import { useState, useEffect } from "react";
import { X, Star, Send, MessageSquare } from "lucide-react";

function MovieDetailModal({ movie, onClose, onAddToHistory, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // ✅ ĐẶT TẤT CẢ HOOKS LÊN TRÊN CÙNG (Trước mọi câu lệnh return)
  useEffect(() => {
    if (movie) {
      if (onAddToHistory) onAddToHistory(movie);

      // Đồng bộ key thành 'movie_comments_' để khớp với Tab Quản lý Bình Luận ở App.jsx
      const savedReviews = localStorage.getItem(`movie_comments_${movie._id}`);
      if (savedReviews) {
        setReviews(JSON.parse(savedReviews));
      } else {
        setReviews([
          {
            id: 1,
            userName: "Nguyễn Văn A",
            userEmail: "nguyenvana@gmail.com",
            rating: 5,
            text: "Phim xem cực kỳ cuốn và cảm xúc!",
            date: "12/05/2026",
          },
          {
            id: 2,
            userName: "Trần Thị B",
            userEmail: "tranthib@gmail.com",
            rating: 4,
            text: "Kỹ xảo đẹp, âm thanh sống động.",
            date: "14/05/2026",
          },
        ]);
      }
    }
  }, [movie]);

  // Sau khi khai báo xong hết các Hooks thì mới được dùng return điều kiện
  if (!movie) return null;

  // Gửi bình luận mới
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    if (!currentUser) {
      alert("Vui lòng đăng nhập để gửi đánh giá và bình luận!");
      return;
    }

    const newReview = {
      id: Date.now(),
      userName: currentUser.name || "Thành viên",
      userEmail: currentUser.email || "",
      rating: Number(rating),
      text: comment.trim(),
      date: new Date().toLocaleDateString("vi-VN"),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(
      `movie_comments_${movie._id}`,
      JSON.stringify(updatedReviews),
    );
    setComment("");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative text-white my-8">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full z-10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung Trình chiếu Video */}
        <div className="aspect-video w-full bg-black">
          {(() => {
            const getEmbedUrl = (url) => {
              if (!url) return "";
              // Xử lý link dạng youtu.be/ID
              if (url.includes("youtu.be/")) {
                const videoId = url.split("youtu.be/")[1]?.split("?")[0];
                return `https://www.youtube.com/embed/${videoId}`;
              }
              // Xử lý link dạng youtube.com/watch?v=ID hoặc youtube.com/embed/ID
              if (url.includes("watch?v=")) {
                const videoId = url.split("watch?v=")[1]?.split("&")[0];
                return `https://www.youtube.com/embed/${videoId}`;
              }
              return url;
            };

            const embedUrl = getEmbedUrl(movie.videoUrl);

            return embedUrl.includes("youtube.com") ? (
              <iframe
                src={embedUrl}
                title={movie.title}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            ) : (
              <video
                src={movie.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              ></video>
            );
          })()}
        </div>

        {/* Thông tin Phim */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">
              {movie.title}
            </h2>
            <p className="text-slate-400 text-sm">
              {movie.description || "Chưa có mô tả chi tiết cho bộ phim này."}
            </p>
          </div>

          {/* 🌟 PHẦN ĐÁNH GIÁ & BÌNH LUẬN */}
          <div className="border-t border-slate-800 pt-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-500">
              <MessageSquare className="w-5 h-5" /> Đánh Giá & Bình Luận (
              {reviews.length})
            </h3>

            {/* Form gửi bình luận */}
            <form
              onSubmit={handleAddReview}
              className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">
                  Chấm điểm sao:
                </span>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>

              <textarea
                rows="2"
                placeholder={
                  currentUser
                    ? "Chia sẻ cảm nghĩ của bạn về bộ phim này..."
                    : "Vui lòng đăng nhập để bình luận..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!currentUser}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              ></textarea>

              <div className="flex justify-between items-center">
                {!currentUser && (
                  <span className="text-xs text-amber-400">
                    ⚠️ Bạn cần đăng nhập để viết bình luận.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!currentUser}
                  className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi Bình Luận
                </button>
              </div>
            </form>

            {/* Danh sách bình luận */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-200">
                      {rev.userName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {rev.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    {[...Array(Number(rev.rating))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300">{rev.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetailModal;
