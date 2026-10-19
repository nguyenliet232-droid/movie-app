import { useState, useEffect } from "react";
import { ArrowLeft, Star, Send, MessageSquare, Heart } from "lucide-react";

function WatchPage({ movie, onBack, currentUser, onAddToHistory }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (movie) {
      if (onAddToHistory) onAddToHistory(movie);
      window.scrollTo(0, 0);

      // Tải bình luận của phim
      const savedReviews = localStorage.getItem(`movie_comments_${movie._id}`);
      if (savedReviews) {
        setReviews(JSON.parse(savedReviews));
      } else {
        setReviews([
          {
            id: 1,
            userName: "Nguyễn Văn A",
            rating: 5,
            text: "Phim xem cực kỳ cuốn và cảm xúc!",
            date: "19/10/2026",
          },
        ]);
      }
    }
  }, [movie]);

  if (!movie) return null;

  // Xử lý link nhúng YouTube tối ưu
  const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0];
    } else if (url.includes("/embed/")) {
      videoId = url.split("/embed/")[1]?.split("?")[0];
    }
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
  };

  const embedUrl = getEmbedUrl(movie.videoUrl);

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!currentUser) {
      alert("Vui lòng đăng nhập để gửi đánh giá!");
      return;
    }

    const newReview = {
      id: Date.now(),
      userName: currentUser.name || "Thành viên",
      rating: Number(rating),
      text: comment.trim(),
      date: new Date().toLocaleDateString("vi-VN"),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(
      `movie_comments_${movie._id}`,
      JSON.stringify(updated),
    );
    setComment("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* 📍 Thanh điều hướng quay lại */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </button>
        <span className="text-sm font-medium text-slate-400">
          / Đang xem: <strong className="text-white">{movie.title}</strong>
        </span>
      </div>

      {/* 📍 Trình phát video kích thước lớn chiếm trọn tầm nhìn */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
          {embedUrl.includes("youtube.com") ? (
            <iframe
              src={embedUrl}
              title={movie.title}
              className="w-full h-full absolute inset-0 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={movie.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-cover"
            ></video>
          )}
        </div>

        {/* Thông tin chi tiết & Bình luận bên dưới */}
        <div className="mt-8 space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-extrabold text-white">
                {movie.title}
              </h1>
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                {movie.category || "Hành động"} ({movie.releaseYear || 2024})
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {movie.description || "Chưa có mô tả chi tiết cho bộ phim này."}
            </p>
          </div>

          {/* Phần Đánh giá & Bình luận */}
          <div className="border-t border-slate-800 pt-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-red-500">
              <MessageSquare className="w-5 h-5" /> Đánh Giá & Bình Luận (
              {reviews.length})
            </h3>

            {/* Form viết đánh giá */}
            <form
              onSubmit={handleAddReview}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-medium">
                  Chấm điểm phim:
                </span>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>

              <textarea
                rows="3"
                placeholder={
                  currentUser
                    ? "Cảm nghĩ của bạn về bộ phim này..."
                    : "Vui lòng đăng nhập để viết bình luận..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!currentUser}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              ></textarea>

              <div className="flex justify-between items-center">
                {!currentUser && (
                  <span className="text-xs text-amber-400">
                    ⚠️ Bạn cần đăng nhập để gửi bình luận.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!currentUser}
                  className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  <Send className="w-4 h-4" /> Gửi Bình Luận
                </button>
              </div>
            </form>

            {/* Danh sách bình luận */}
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-200">
                      {rev.userName}
                    </span>
                    <span className="text-xs text-slate-500">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    {[...Array(Number(rev.rating))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300">{rev.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchPage;
