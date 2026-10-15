import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";
import AuthModal from "./components/AuthModal";

const API_URL = "https://user-management-backend-7clg.onrender.com/api";

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // 🌟 Thêm state quản lý thể loại đang chọn
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const categories = [
    "Tất cả",
    "Hành động",
    "Tình cảm",
    "Hoạt hình",
    "Kinh dị",
    "Khoa học viễn tưởng",
  ];

  // 1. Khôi phục người dùng & Tải danh sách phim từ Backend
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_URL}/movies`);
        const data = await res.json();
        if (res.ok) setMovies(data);
      } catch (err) {
        console.error("Lỗi lấy danh sách phim:", err);
      } finally {
        setLoading(false);
      }
    };

    const savedUser = localStorage.getItem("movie_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    fetchMovies();
  }, []);

  // 2. Xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("movie_user");
    localStorage.removeItem("movie_token");
    setCurrentUser(null);
  };

  // 🌟 Lọc phim theo từ khóa tìm kiếm VÀ theo thể loại
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tất cả" || movie.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* 📍 Navbar Header */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* 📍 Hero Banner (Phim Nổi Bật Đầu Tiên) */}
      {movies.length > 0 && (
        <div className="relative h-[450px] w-full bg-slate-900 overflow-hidden">
          <img
            src={movies[0].posterUrl}
            alt={movies[0].title}
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
              <img
                src={movies[0].posterUrl}
                alt={movies[0].title}
                className="w-48 h-72 rounded-xl object-cover shadow-2xl border-2 border-slate-700/50 hidden md:block"
              />
              <div className="space-y-4 max-w-xl">
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                  Phim Nổi Bật
                </span>
                <h1 className="text-4xl font-extrabold text-white">
                  {movies[0].title}
                </h1>
                <p className="text-slate-300 text-sm line-clamp-3">
                  {movies[0].description || "Chưa có mô tả cho bộ phim này."}
                </p>
                <button
                  onClick={() => setSelectedMovie(movies[0])}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Xem Phim Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📍 THANH LỌC THỂ LOẠI */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 📍 Danh sách phim Grid */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
          🎬 Danh Sách Phim{" "}
          {selectedCategory !== "Tất cả" ? `- ${selectedCategory}` : ""}
        </h2>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            ⏳ Đang tải danh sách phim từ server...
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Không tìm thấy bộ phim nào trong thể loại này.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 📍 Modal Xem Phim */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />

      {/* 📍 Modal Đăng ký / Đăng nhập OTP */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default App;
