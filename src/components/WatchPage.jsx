import { useState, useEffect } from "react";
import { ArrowLeft, Star, Send, MessageSquare, Share2 } from "lucide-react";
import { readJsonStorage } from "../utils/storage";

export default function WatchPage({
  movie,
  onBack,
  currentUser,
  onAddToHistory,
  allMovies,
  onSelectMovie,
  darkMode,
}) {
  const [reviews, setReviews] = useState(() => {
    return movie
      ? readJsonStorage(
          `movie_comments_${movie._id}`,
          [
          {
            id: 1,
            userName: "Nguyễn Văn A",
            rating: 5,
            text: "Phim xem cực kỳ cuốn và cảm xúc!",
            date: "19/10/2026",
          },
          ],
          Array.isArray,
        )
      : [];
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (movie) {
      if (onAddToHistory) onAddToHistory(movie);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [movie, onAddToHistory]);

  if (!movie) return null;

  // Lọc phim liên quan (cùng thể loại, khác ID phim hiện tại)
  const relatedMovies = allMovies
    ? allMovies
        .filter((m) => m.category === movie.category && m._id !== movie._id)
        .slice(0, 5)
    : [];

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
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=1`;
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
    <div
      className={`min-h-screen ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-slate-900"} pb-16 animate-fadeIn`}
    >
      {/* 📍 Thanh điều hướng quay lại & Chia sẻ */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-red-600/20"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </button>

        <button
          onClick={() => {
            const shareUrl = window.location.href;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl);
              alert("Đã sao chép liên kết phim vào clipboard! 🔗");
            } else {
              prompt("Sao chép liên kết này để chia sẻ:", shareUrl);
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            darkMode
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              : "bg-white border-gray-200 text-slate-700 hover:bg-gray-100 shadow-sm"
          }`}
          title="Chia sẻ phim"
        >
          <Share2 className="w-4 h-4 text-red-500" />
          <span>Chia sẻ phim</span>
        </button>
      </div>

      {/* 📍 Khung chính chứa Video và Phim đề xuất bên cạnh */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Trình phát video kích thước lớn */}
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative mb-8">
          {embedUrl.includes("youtube.com") ? (
            <iframe
              src={embedUrl}
              title={movie.title || movie.name}
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

        {/* Chia lưới 2 cột: Cột trái (Thông tin + Bình luận) | Cột phải (Phim đề xuất) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI: Thông tin phim & Bình luận (Chiếm 2 phần) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold">
                  {movie.title || movie.name}
                </h1>
                <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                  {movie.category || "Hành động"} ({movie.releaseYear || 2024})
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-gray-600"}`}
              >
                {movie.description || "Chưa có mô tả chi tiết cho bộ phim này."}
              </p>
            </div>

            {/* Phần Đánh giá & Bình luận */}
            <div
              className={`border-t ${darkMode ? "border-slate-800" : "border-gray-200"} pt-8 space-y-6`}
            >
              <h3 className="text-xl font-bold flex items-center gap-2 text-red-500">
                <MessageSquare className="w-5 h-5" /> Đánh Giá & Bình Luận (
                {reviews.length})
              </h3>

              {/* Form viết đánh giá */}
              <form
                onSubmit={handleAddReview}
                className={`${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-md"} p-5 rounded-2xl border space-y-4`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-gray-700"}`}
                  >
                    Chấm điểm phim:
                  </span>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className={`border rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none cursor-pointer ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-gray-100 border-gray-300"
                    }`}
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
                  className={`w-full border rounded-xl p-4 text-sm focus:outline-none focus:border-red-500 disabled:opacity-50 ${
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-gray-50 border-gray-300 text-slate-900"
                  }`}
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
                    className={`${darkMode ? "bg-slate-900/60 border-slate-800/80 text-slate-300" : "bg-white border-gray-200 text-slate-700 shadow-sm"} p-4 rounded-2xl border space-y-2`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-red-500">
                        {rev.userName}
                      </span>
                      <span className="text-xs text-slate-400">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      {[...Array(Number(rev.rating))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: PHIM ĐỀ XUẤT CÙNG THỂ LOẠI (Chiếm 1 phần) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              🔥 Phim Đề Xuất Cùng Thể Loại
            </h3>
            {relatedMovies.length === 0 ? (
              <p
                className={`text-xs ${darkMode ? "text-slate-500" : "text-gray-400"}`}
              >
                Chưa có phim gợi ý nào khác trong thể loại này.
              </p>
            ) : (
              <div className="space-y-3">
                {relatedMovies.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (onSelectMovie) onSelectMovie(item);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                      darkMode
                        ? "bg-slate-900 border-slate-800 hover:border-red-500/50 text-white"
                        : "bg-white border-gray-200 shadow-sm text-slate-900"
                    }`}
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title || item.name}
                      className="w-16 h-20 object-cover rounded-lg shadow"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="text-xs font-bold truncate">
                        {item.title || item.name}
                      </h4>
                      <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <p
                        className={`text-[11px] line-clamp-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                      >
                        {item.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
