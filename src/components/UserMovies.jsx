import { useState, useEffect } from "react";
import { Crown } from "lucide-react";

const API_URL = "https://user-management-backend-7clg.onrender.com/api";

function UserMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_URL}/movies`);
        const data = await res.json();
        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi tải phim:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const handleWatchMovie = (movie) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isUserVip = currentUser?.isVip || currentUser?.role === "admin";

    if (movie.isVipOnly && !isUserVip) {
      alert(
        "🔒 Bộ phim này chỉ dành riêng cho tài khoản VIP! Vui lòng nâng cấp tài khoản để xem.",
      );
      return;
    }

    setSelectedMovie(movie);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        🎬 Danh Sách Phim Mới Nhất
      </h2>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          ⏳ Đang tải phim...
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Chưa có bộ phim nào.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              onClick={() => handleWatchMovie(movie)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer group hover:shadow-md transition relative"
            >
              <div className="relative aspect-3/4 bg-slate-100 overflow-hidden">
                {/* Hỗ trợ hiển thị cả poster từ TMDB lẫn poster thủ công */}
                <img
                  src={movie.posterUrl || movie.poster || "https://via.placeholder.com/150x225?text=No+Image"}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/150x225?text=No+Image";
                  }}
                />

                {movie.isVipOnly && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-1 rounded-md shadow flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP
                  </span>
                )}
              </div>

              <div className="p-3">
                <h3 className="font-bold text-slate-800 text-sm truncate">
                  {movie.title}
                </h3>
                <span className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold inline-block mt-1">
                  {movie.category || "Hành động"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Phát Video */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl max-w-3xl w-full p-4 text-white relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">{selectedMovie.title}</h3>
              <button
                onClick={() => setSelectedMovie(null)}
                className="text-slate-400 hover:text-white font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {selectedMovie.videoUrl ? (
                <iframe
                  src={selectedMovie.videoUrl}
                  title={selectedMovie.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <p className="text-slate-400">
                  Đang cập nhật link video cho phim này...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMovies;
