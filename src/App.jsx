import { useState, useEffect } from "react";
import {
  Play,
  Heart,
  History,
  User,
  Mail,
  Shield,
  Film,
  ArrowLeft,
  Star,
  Send,
  MessageSquare,
} from "lucide-react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import AuthModal from "./components/AuthModal";

const API_URL = "https://user-management-backend-7clg.onrender.com/api";

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home", "watchlist", "history", "profile", "my-comments", "watch"

  // 🌟 State quản lý chế độ Sáng / Tối
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("movie_dark_mode");
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  useEffect(() => {
    localStorage.setItem("movie_dark_mode", JSON.stringify(darkMode));
  }, [darkMode]);

  // 🌟 State quản lý Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // 🌟 Quản lý danh sách Yêu thích
  const [favorites, setFavorites] = useState(() => {
    const savedFavs = localStorage.getItem("movie_favorites");
    return savedFavs ? JSON.parse(savedFavs) : [];
  });

  // 🌟 Quản lý Lịch sử xem (Continue Watching)
  const [watchHistory, setWatchHistory] = useState(() => {
    const savedHistory = localStorage.getItem("movie_watch_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // 🌟 Quản lý thể loại đang chọn
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const categories = [
    "Tất cả",
    "Hành động",
    "Tình cảm",
    "Hoạt hình",
    "Kinh dị",
    "Khoa học viễn tưởng",
  ];

  // 🌟 State Quản lý Sắp xếp nâng cao ("latest" | "az" | "rating")
  const [sortBy, setSortBy] = useState("latest");

  // 🌟 State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 10;

  // 🌟 State quản lý vị trí Banner tự động chạy xoay vòng (cứ 6 giây đổi phim)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(
        (prevIndex) => (prevIndex + 1) % Math.min(movies.length, 5),
      );
    }, 6000); // 6 giây

    return () => clearInterval(interval);
  }, [movies]);

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

  useEffect(() => {
    localStorage.setItem("movie_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("movie_watch_history", JSON.stringify(watchHistory));
  }, [watchHistory]);

  // Reset về trang 1 khi đổi tab hoặc đổi từ khóa tìm kiếm / thể loại / sắp xếp
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedCategory, sortBy]);

  const handleLogout = () => {
    localStorage.removeItem("movie_user");
    localStorage.removeItem("movie_token");
    setCurrentUser(null);
    setActiveTab("home");
    showToast("Đã đăng xuất tài khoản thành công!", "success");
  };

  const handleToggleFavorite = (movie) => {
    setFavorites((prevFavs) => {
      const exists = prevFavs.some((item) => item._id === movie._id);
      if (exists) {
        showToast("Đã xóa phim khỏi danh sách yêu thích", "error");
        return prevFavs.filter((item) => item._id !== movie._id);
      } else {
        showToast("Đã thêm phim vào danh sách yêu thích ❤️", "success");
        return [...prevFavs, movie];
      }
    });
  };

  const handleAddToHistory = (movie) => {
    setWatchHistory((prevHistory) => {
      const filtered = prevHistory.filter((item) => item._id !== movie._id);
      return [movie, ...filtered];
    });
  };

  // 🌟 Hàm chuyển sang trang xem phim riêng biệt
  const handleOpenWatchPage = (movie) => {
    setSelectedMovie(movie);
    handleAddToHistory(movie);
    setActiveTab("watch");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDisplayMovies = () => {
    if (activeTab === "watchlist") return favorites;
    if (activeTab === "history") return watchHistory;
    return movies;
  };

  // 1. Lọc theo từ khóa tìm kiếm và thể loại
  const filteredMovies = getDisplayMovies().filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tất cả" || movie.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 2. Sắp xếp nâng cao
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    if (sortBy === "az") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "rating") {
      return (b.rating || 5) - (a.rating || 5);
    } else {
      return new Date(b.createdAt || 0) - new Date(b.createdAt || 0);
    }
  });

  // 3. Phân trang
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = sortedMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(sortedMovies.length / moviesPerPage);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-slate-900"}`}
    >
      {/* 📍 Navbar Header */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        favoriteCount={favorites.length}
        historyCount={watchHistory.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* 📍 NỘI DUNG HIỂN THỊ DỰA TRÊN TAB */}
      {activeTab === "watch" && selectedMovie ? (
        <WatchPage
          movie={selectedMovie}
          onBack={() => setActiveTab("home")}
          currentUser={currentUser}
          onAddToHistory={handleAddToHistory}
          allMovies={movies}
          onSelectMovie={handleOpenWatchPage}
          darkMode={darkMode}
        />
      ) : activeTab === "profile" ? (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div
            className={`${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-gray-200 text-slate-900 shadow-xl"} border rounded-2xl p-8 relative overflow-hidden transition-colors`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-500">
              <User className="w-7 h-7" /> Hồ Sơ Cá Nhân & Cài Đặt
            </h2>

            {currentUser ? (
              <div className="space-y-6">
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border ${darkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100 border-gray-200"}`}
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {currentUser.name
                      ? currentUser.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentUser.name}</h3>
                    <p
                      className={`text-xs mt-0.5 flex items-center gap-1.5 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/30 border-slate-800" : "bg-gray-100 border-gray-200"}`}
                  >
                    <span
                      className={`text-xs block mb-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Phim yêu thích đã lưu
                    </span>
                    <span className="text-2xl font-bold text-red-500">
                      {favorites.length} bộ phim
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/30 border-slate-800" : "bg-gray-100 border-gray-200"}`}
                  >
                    <span
                      className={`text-xs block mb-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Lịch sử xem gần đây
                    </span>
                    <span className="text-2xl font-bold text-amber-500">
                      {watchHistory.length} bộ phim
                    </span>
                  </div>
                </div>

                {/* Form cập nhật thông tin & Đổi mật khẩu */}
                <div
                  className={`p-4 rounded-xl border space-y-4 ${darkMode ? "bg-slate-800/20 border-slate-800" : "bg-gray-50 border-gray-200"}`}
                >
                  <h4 className="text-sm font-semibold text-red-500">
                    Chỉnh sửa thông tin cá nhân
                  </h4>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nhập tên mới..."
                      defaultValue={currentUser.name}
                      id="updateNameInput"
                      className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-gray-300 text-slate-900"
                      }`}
                    />
                    <button
                      onClick={() => {
                        const inputEl =
                          document.getElementById("updateNameInput");
                        if (!inputEl || !inputEl.value.trim()) return;
                        const updated = {
                          ...currentUser,
                          name: inputEl.value.trim(),
                        };
                        setCurrentUser(updated);
                        localStorage.setItem(
                          "movie_user",
                          JSON.stringify(updated),
                        );
                        showToast("Cập nhật tên thành công!", "success");
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Lưu tên
                    </button>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-700/50">
                    <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      🔒 Bảo mật & Đổi mật khẩu
                    </h5>

                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Mật khẩu hiện tại..."
                        id="oldPasswordInput"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                          darkMode
                            ? "bg-slate-900 border-slate-700 text-white"
                            : "bg-white border-gray-300 text-slate-900"
                        }`}
                      />
                      <input
                        type="password"
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                        id="newPasswordInput"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                          darkMode
                            ? "bg-slate-900 border-slate-700 text-white"
                            : "bg-white border-gray-300 text-slate-900"
                        }`}
                      />
                      <input
                        type="password"
                        placeholder="Xác nhận lại mật khẩu mới..."
                        id="confirmPasswordInput"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                          darkMode
                            ? "bg-slate-900 border-slate-700 text-white"
                            : "bg-white border-gray-300 text-slate-900"
                        }`}
                      />

                      <button
                        onClick={() => {
                          const oldPass =
                            document.getElementById("oldPasswordInput").value;
                          const newPass =
                            document.getElementById("newPasswordInput").value;
                          const confirmPass = document.getElementById(
                            "confirmPasswordInput",
                          ).value;

                          if (!oldPass || !newPass || !confirmPass) {
                            showToast(
                              "Vui lòng điền đầy đủ thông tin mật khẩu!",
                              "error",
                            );
                            return;
                          }
                          if (newPass.length < 6) {
                            showToast(
                              "Mật khẩu mới phải có ít nhất 6 ký tự!",
                              "error",
                            );
                            return;
                          }
                          if (newPass !== confirmPass) {
                            showToast("Mật khẩu xác nhận không khớp!", "error");
                            return;
                          }

                          showToast("Đổi mật khẩu thành công!", "success");
                          document.getElementById("oldPasswordInput").value =
                            "";
                          document.getElementById("newPasswordInput").value =
                            "";
                          document.getElementById(
                            "confirmPasswordInput",
                          ).value = "";
                        }}
                        className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Cập nhật mật khẩu mới
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    onClick={() => setActiveTab("home")}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg shadow-red-600/30"
                  >
                    Khám phá phim ngay
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-gray-200 hover:bg-gray-300 text-slate-700"}`}
                  >
                    Đăng xuất tài khoản
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <p
                  className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                >
                  Bạn chưa đăng nhập vào tài khoản.
                </p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "history" ? (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              <History className="w-6 h-6 text-amber-500" /> Lịch Sử Xem Gần Đây
              ({watchHistory.length})
            </h2>
            {watchHistory.length > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?",
                    )
                  ) {
                    setWatchHistory([]);
                    localStorage.removeItem("movie_watch_history");
                    showToast("Đã xóa lịch sử xem", "success");
                  }
                }}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Xóa lịch sử xem
              </button>
            )}
          </div>

          {watchHistory.length === 0 ? (
            <div
              className={`text-center py-20 space-y-4 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
            >
              <p>Bạn chưa xem bộ phim nào gần đây.</p>
              <button
                onClick={() => setActiveTab("home")}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
              >
                Khám phá phim ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watchHistory.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onClick={() => handleOpenWatchPage(movie)}
                  isFavorite={favorites.some((fav) => fav._id === movie._id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "my-comments" ? (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <div
            className={`${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-gray-200 text-slate-900 shadow-xl"} border rounded-2xl p-8 space-y-6`}
          >
            <h2 className="text-2xl font-bold flex items-center gap-3 text-red-500">
              💬 Bình Luận & Đánh Giá Của Bạn
            </h2>

            {!currentUser ? (
              <p
                className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                Vui lòng đăng nhập để xem lịch sử bình luận.
              </p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const userComments = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("movie_comments_")) {
                      const movieId = key.replace("movie_comments_", "");
                      const comments = JSON.parse(
                        localStorage.getItem(key) || "[]",
                      );
                      comments.forEach((c) => {
                        if (
                          c.userName === currentUser.name ||
                          c.userEmail === currentUser.email
                        ) {
                          userComments.push({ ...c, movieId });
                        }
                      });
                    }
                  }

                  if (userComments.length === 0) {
                    return (
                      <div
                        className={`text-center py-12 space-y-3 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                      >
                        <p>Bạn chưa đăng bình luận đánh giá nào.</p>
                        <button
                          onClick={() => setActiveTab("home")}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
                        >
                          Khám phá phim ngay
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {userComments.map((item, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border space-y-1 ${darkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-red-500">
                              Đánh giá: {item.rating} ⭐
                            </span>
                            <span
                              className={
                                darkMode ? "text-slate-400" : "text-gray-500"
                              }
                            >
                              {item.createdAt || "Gần đây"}
                            </span>
                          </div>
                          <p className="text-sm">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 🌟 BANNER TỰ ĐỘNG CHUYỂN ĐỔI SAU MỖI 6 GIÂY */}
          {activeTab === "home" &&
            movies.length > 0 &&
            (() => {
              const bannerMovies = movies.slice(0, 5);
              const currentBannerMovie =
                bannerMovies[currentBannerIndex] || movies[0];

              return (
                <div className="relative h-[480px] w-full bg-slate-900 overflow-hidden transition-all duration-700">
                  <img
                    key={currentBannerMovie._id}
                    src={currentBannerMovie.posterUrl}
                    alt={currentBannerMovie.title}
                    className="w-full h-full object-cover opacity-35 blur-sm transition-opacity duration-1000 animate-fadeIn"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 w-full justify-between">
                      <div className="flex items-center gap-8">
                        <img
                          key={`poster-${currentBannerMovie._id}`}
                          src={currentBannerMovie.posterUrl}
                          alt={currentBannerMovie.title}
                          className="w-48 h-72 rounded-xl object-cover shadow-2xl border-2 border-slate-700/50 hidden md:block animate-fadeIn"
                        />
                        <div
                          className="space-y-4 max-w-xl animate-fadeIn"
                          key={`info-${currentBannerMovie._id}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                              🔥 Phim Nổi Bật ({currentBannerIndex + 1}/
                              {bannerMovies.length})
                            </span>
                            <span className="text-xs text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700">
                              {currentBannerMovie.category || "Hành động"}
                            </span>
                          </div>

                          <h1 className="text-4xl font-extrabold text-white tracking-wide">
                            {currentBannerMovie.title}
                          </h1>

                          <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                            {currentBannerMovie.description ||
                              "Chưa có mô tả cho bộ phim này."}
                          </p>

                          <button
                            onClick={() =>
                              handleOpenWatchPage(currentBannerMovie)
                            }
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-red-600/30 cursor-pointer"
                          >
                            <Play className="w-5 h-5 fill-current" />
                            <span>Xem Phim Ngay</span>
                          </button>
                        </div>
                      </div>

                      {/* Các chấm tròn điều hướng thủ công */}
                      <div className="flex md:flex-col gap-2 items-center justify-center">
                        {bannerMovies.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentBannerIndex(idx)}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${
                              currentBannerIndex === idx
                                ? "w-8 h-2.5 bg-red-600"
                                : "w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400"
                            }`}
                            aria-label={`Chuyển banner ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* 📍 THANH LỌC THỂ LOẠI NÂNG CAO & SẮP XẾP */}
          {activeTab === "home" && (
            <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveTab("home");
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer transform hover:scale-105 ${
                      selectedCategory === cat && activeTab === "home"
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                        : darkMode
                          ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                          : "bg-white text-slate-600 hover:bg-gray-100 border border-gray-200 shadow-sm"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span
                  className={`text-xs font-medium whitespace-nowrap ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                >
                  Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-red-500 cursor-pointer ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-white border-gray-200 text-slate-800 shadow-sm"
                  }`}
                >
                  <option value="latest">Mới cập nhật</option>
                  <option value="az">Tên phim (A - Z)</option>
                  <option value="rating">Đánh giá cao nhất</option>
                </select>
              </div>
            </div>
          )}

          <main className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-bold flex items-center gap-2 ${darkMode ? "text-slate-100" : "text-slate-800"}`}
              >
                {activeTab === "home" &&
                  `🎬 Danh Sách Phim ${selectedCategory !== "Tất cả" ? `- ${selectedCategory}` : ""}`}
                {activeTab === "watchlist" &&
                  `❤️ Danh Sách Phim Yêu Thích (${favorites.length})`}
              </h2>

              {activeTab !== "home" && (
                <button
                  onClick={() => setActiveTab("home")}
                  className="text-xs text-red-500 hover:underline cursor-pointer font-medium"
                >
                  ← Khám phá thêm phim mới
                </button>
              )}
            </div>

            {loading ? (
              <div
                className={`text-center py-20 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                ⏳ Đang tải danh sách phim từ server...
              </div>
            ) : currentMovies.length === 0 ? (
              <div
                className={`text-center py-20 space-y-3 ${darkMode ? "text-slate-500" : "text-gray-400"}`}
              >
                <p>Không tìm thấy bộ phim nào phù hợp.</p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
                >
                  Khám phá phim ngay
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {currentMovies.map((movie) => (
                    <MovieCard
                      key={movie._id}
                      movie={movie}
                      onClick={() => handleOpenWatchPage(movie)}
                      isFavorite={favorites.some(
                        (fav) => fav._id === movie._id,
                      )}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        currentPage === 1
                          ? "opacity-40 cursor-not-allowed bg-slate-800"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      Trang trước
                    </button>

                    <span
                      className={`text-xs font-medium px-4 py-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Trang {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        currentPage === totalPages
                          ? "opacity-40 cursor-not-allowed bg-slate-800"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* 📍 Modal Đăng ký / Đăng nhập OTP */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Chào mừng trở lại, ${user.name || "Bạn"}!`, "success");
        }}
      />

      {/* 🌟 Toast Notification hiện đại */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-3 transition-all transform animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-500/40"
              : "bg-red-600 text-white shadow-red-600/30 border border-red-500/40"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 🌟 COMPONENT: TRANG XEM PHIM RIÊNG BIỆT (DEDICATED WATCH PAGE)
// ========================================================
function WatchPage({
  movie,
  onBack,
  currentUser,
  onAddToHistory,
  allMovies,
  onSelectMovie,
  darkMode,
}) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (movie) {
      if (onAddToHistory) onAddToHistory(movie);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Tải bình luận của phim từ localStorage
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
      {/* 📍 Thanh điều hướng quay lại */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-red-600/20"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </button>
        <span
          className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
        >
          Đang xem:{" "}
          <strong className={darkMode ? "text-white" : "text-slate-900"}>
            {movie.title}
          </strong>
        </span>
      </div>

      {/* 📍 Khung chính chứa Video và Phim đề xuất bên cạnh */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Trình phát video kích thước lớn */}
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative mb-8">
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

        {/* Chia lưới 2 cột: Cột trái (Thông tin + Bình luận) | Cột phải (Phim đề xuất) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI: Thông tin phim & Bình luận (Chiếm 2 phần) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold">{movie.title}</h1>
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
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-lg shadow"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="text-xs font-bold truncate">
                        {item.title}
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

export default App;
