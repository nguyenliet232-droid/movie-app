import { useState, useEffect, useCallback, useRef } from "react";
import { Play, History, User } from "lucide-react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import SkeletonCard from "./components/SkeletonCard";
import AuthModal from "./components/AuthModal";
import WatchPage from "./components/WatchPage";
import { API_URL } from "./utils/api";
import { readJsonStorage } from "./utils/storage";

function App() {
  const avatarFileInputRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moviesError, setMoviesError] = useState("");

  const [currentUser, setCurrentUser] = useState(() =>
    readJsonStorage(
      "movie_user",
      null,
      (value) =>
        value === null || (typeof value === "object" && !Array.isArray(value)),
    ),
  );

  const [profileName, setProfileName] = useState(() => currentUser?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(
    () => currentUser?.avatar || "",
  );
  const [hasProfileAvatarError, setHasProfileAvatarError] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home", "watchlist", "history", "profile", "my-comments", "watch"

  // 🌟 State quản lý chế độ Sáng / Tối
  const [darkMode, setDarkMode] = useState(() =>
    readJsonStorage(
      "movie_dark_mode",
      true,
      (value) => typeof value === "boolean",
    ),
  );

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

  // 🌟 Quản lý danh sách Yêu thích & Lịch sử
  const [favorites, setFavorites] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);

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

  // 🌟 BƯỚC 1: State mở rộng Lọc theo Quốc gia và Năm phát hành
  const [selectedCountry, setSelectedCountry] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");

  const countries = [
    "Tất cả",
    "Hàn Quốc",
    "Mỹ",
    "Trung Quốc",
    "Nhật Bản",
    "Việt Nam",
  ];
  const years = ["Tất cả", "2026", "2025", "2024", "2023"];

  // 🌟 State Quản lý Sắp xếp nâng cao ("latest" | "az" | "rating")
  const [sortBy, setSortBy] = useState("latest");

  // 🌟 State Quản lý số lượng hiển thị (Load More)
  const [visibleCountState, setVisibleCountState] = useState({
    key: "",
    count: 10,
  });
  const visibilityKey = JSON.stringify([
    activeTab,
    searchTerm,
    selectedCategory,
    selectedCountry,
    selectedYear,
    sortBy,
  ]);
  const visibleCount =
    visibleCountState.key === visibilityKey ? visibleCountState.count : 10;

  // 🌟 State quản lý vị trí Banner tự động chạy xoay vòng
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(
        (prevIndex) => (prevIndex + 1) % Math.min(movies.length, 5),
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [movies]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_URL}/movies`);
        if (!res.ok) {
          throw new Error(`Movie request failed with status ${res.status}.`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new TypeError("Movie API returned an invalid response.");
        }

        setMovies(data);
      } catch (err) {
        console.error("Lỗi lấy danh sách phim:", err);
        setMoviesError(
          "Không thể tải danh sách phim. Vui lòng thử tải lại trang.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // 🌟 Đồng bộ dữ liệu Yêu thích và Lịch sử trực tiếp từ MongoDB khi có user đăng nhập
  useEffect(() => {
    const fetchUserDataFromDB = async () => {
      const token = localStorage.getItem("movie_token");
      if (!token || !currentUser) {
        setFavorites([]);
        setWatchHistory([]);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/sync-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
          setWatchHistory(data.watchHistory || []);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu từ database:", err);
      }
    };

    fetchUserDataFromDB();
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("movie_user");
    localStorage.removeItem("movie_token");
    localStorage.removeItem("movie_favorites");
    localStorage.removeItem("movie_watch_history");

    setCurrentUser(null);
    setFavorites([]);
    setWatchHistory([]);
    setProfileName("");
    setProfileAvatar("");
    setHasProfileAvatarError(false);
    setActiveTab("home");

    showToast("Đã đăng xuất tài khoản thành công!", "success");
  };

  const handleToggleFavorite = async (movie) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      showToast("Vui lòng đăng nhập để lưu phim yêu thích!", "error");
      return;
    }

    const exists = favorites.some((item) => item._id === movie._id);
    const updatedFavs = exists
      ? favorites.filter((item) => item._id !== movie._id)
      : [...favorites, movie];
    setFavorites(updatedFavs);

    showToast(
      exists
        ? "Đã xóa phim khỏi danh sách yêu thích"
        : "Đã thêm phim vào danh sách yêu thích ❤️",
      exists ? "error" : "success",
    );

    try {
      const token = localStorage.getItem("movie_token");
      await fetch(`${API_URL}/users/favorites`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: movie._id }),
      });
    } catch (err) {
      console.error("Lỗi lưu yêu thích lên server:", err);
    }
  };

  const handleAddToHistory = useCallback(
    async (movie) => {
      if (!currentUser) return;

      setWatchHistory((prevHistory) => {
        const filtered = prevHistory.filter((item) => item._id !== movie._id);
        return [movie, ...filtered];
      });

      try {
        const token = localStorage.getItem("movie_token");
        await fetch(`${API_URL}/users/history`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId: movie._id }),
        });
      } catch (err) {
        console.error("Lỗi lưu lịch sử lên server:", err);
      }
    },
    [currentUser],
  );

  // 🌟 Hàm hỗ trợ cập nhật trực tiếp tên hoặc ảnh đại diện lên MongoDB
  const handleUpdateProfileDirectly = async (newName, newAvatar) => {
    try {
      const token = localStorage.getItem("movie_token");
      const res = await fetch(`${API_URL}/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          avatar: newAvatar,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem("movie_user", JSON.stringify(data.user));
        showToast("✨ Cập nhật hồ sơ thành công!", "success");
      } else {
        showToast(data.message || "Cập nhật thất bại!", "error");
      }
    } catch (err) {
      console.error("Lỗi kết nối:", err);
      showToast("Lỗi kết nối đến máy chủ!", "error");
    }
  };

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

  // 🌟 Lọc phim nâng cao theo Từ khóa, Thể loại, Quốc gia và Năm
  const filteredMovies = getDisplayMovies().filter((movie) => {
    const title = movie.title || movie.name || "";
    const matchesSearch = title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tất cả" || movie.category === selectedCategory;
    const matchesCountry =
      selectedCountry === "Tất cả" || movie.country === selectedCountry;
    const matchesYear =
      selectedYear === "Tất cả" || String(movie.releaseYear) === selectedYear;

    return matchesSearch && matchesCategory && matchesCountry && matchesYear;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    const titleA = a.title || a.name || "";
    const titleB = b.title || b.name || "";
    if (sortBy === "az") {
      return titleA.localeCompare(titleB);
    } else if (sortBy === "rating") {
      return (b.rating || 5) - (a.rating || 5);
    } else {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const currentMovies = sortedMovies.slice(0, visibleCount);
  const hasMore = visibleCount < sortedMovies.length;

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
        movies={movies}
        onSelectMovie={handleOpenWatchPage}
      />

      {/* 📍 NỘI DUNG HIỂN THỊ DỰA TRÊN TAB */}
      {activeTab === "watch" && selectedMovie ? (
        <WatchPage
          key={selectedMovie._id}
          movie={selectedMovie}
          onBack={() => setActiveTab("home")}
          currentUser={currentUser}
          onAddToHistory={handleAddToHistory}
          allMovies={movies}
          onSelectMovie={handleOpenWatchPage}
          darkMode={darkMode}
        />
      ) : activeTab === "profile" ? (
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div
            className={`${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-gray-200 text-slate-900 shadow-xl"} border rounded-3xl overflow-hidden transition-colors`}
          >
            {/* 🌟 BANNER TÍCH HỢP CHỈNH SỬA TRỰC TIẾP */}
            <div className="h-44 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

              <div className="absolute bottom-4 left-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full pr-10">
                {/* 1. Click vào ảnh đại diện để đổi ảnh từ máy */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() =>
                    document.getElementById("bannerFileAvatarInput").click()
                  }
                  title="Bấm để đổi ảnh đại diện"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 shadow-2xl group-hover:opacity-80 transition"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4 border-slate-800 group-hover:opacity-80 transition">
                      {currentUser?.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[11px] font-semibold text-center p-1">
                    📷 Đổi ảnh
                  </div>
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full"></span>
                </div>

                {/* Input chọn file ẩn cho Banner */}
                <input
                  type="file"
                  id="bannerFileAvatarInput"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64String = reader.result;
                        await handleUpdateProfileDirectly(
                          currentUser?.name,
                          base64String,
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {/* 2. Click vào tên để sửa tên trực tiếp */}
                <div className="text-white drop-shadow-md space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={currentUser?.name || ""}
                      id="bannerNameInput"
                      onBlur={async (e) => {
                        const newName = e.target.value.trim();
                        if (newName && newName !== currentUser?.name) {
                          await handleUpdateProfileDirectly(
                            newName,
                            currentUser?.avatar,
                          );
                        }
                      }}
                      className="bg-transparent hover:bg-white/10 focus:bg-slate-900/80 px-2.5 py-1 rounded-xl text-2xl font-extrabold focus:outline-none focus:ring-2 focus:ring-red-500 transition w-full sm:w-auto max-w-xs"
                      placeholder="Nhập tên của bạn..."
                      title="Bấm vào tên để sửa, bấm ra ngoài để lưu"
                    />
                    <span className="text-xs bg-black/30 px-2 py-0.5 rounded-md text-slate-300 hidden sm:inline-block">
                      ✏️ Bấm vào tên để sửa
                    </span>
                  </div>
                  <p className="text-xs text-white/80 px-2.5">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Nội dung chi tiết hồ sơ bên dưới */}
            <div className="p-8 space-y-8 mt-2">
              {/* Chọn nhanh Avatar mẫu */}
              <div
                className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-800/30 border-slate-800" : "bg-gray-50 border-gray-200"} flex flex-col sm:flex-row items-center justify-between gap-4`}
              >
                <span
                  className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-gray-700"}`}
                >
                  🌟 Hoặc chọn nhanh avatar mẫu có sẵn:
                </span>
                <div className="flex items-center gap-3">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
                    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
                  ].map((sampleUrl, idx) => (
                    <img
                      key={idx}
                      src={sampleUrl}
                      alt="Sample"
                      onClick={async () => {
                        await handleUpdateProfileDirectly(
                          currentUser?.name,
                          sampleUrl,
                        );
                      }}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 hover:border-red-500 cursor-pointer transition transform hover:scale-110 shadow-md"
                      title="Bấm để đổi sang ảnh này"
                    />
                  ))}
                </div>
              </div>

              {/* Thẻ thống kê nhanh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-gray-50 border-gray-200"} flex items-center justify-between`}
                >
                  <div>
                    <span
                      className={`text-xs block font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Phim yêu thích đã lưu
                    </span>
                    <span className="text-2xl font-bold text-red-500 mt-1 inline-block">
                      {favorites.length} bộ phim
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 text-xl font-bold">
                    ❤️
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-gray-50 border-gray-200"} flex items-center justify-between`}
                >
                  <div>
                    <span
                      className={`text-xs block font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Lịch sử xem gần đây
                    </span>
                    <span className="text-2xl font-bold text-amber-500 mt-1 inline-block">
                      {watchHistory.length} bộ phim
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl font-bold">
                    🕒
                  </div>
                </div>
              </div>

              {/* Đổi Mật Khẩu */}
              {currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-xl mx-auto">
                  <div
                    className={`p-6 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-800/20 border-slate-800" : "bg-gray-50 border-gray-200"}`}
                  >
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                      🔒 Đổi Mật Khẩu Tài Khoản
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}
                        >
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="oldPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-slate-900"}`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}
                        >
                          Mật khẩu mới (tối thiểu 6 ký tự)
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="newPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-slate-900"}`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}
                        >
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="confirmPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-slate-900"}`}
                        />
                      </div>

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
                              "Vui lòng điền đầy đủ các trường mật khẩu!",
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
                          showToast(
                            "Chức năng đổi mật khẩu đang được phát triển.",
                            "error",
                          );
                        }}
                        className="w-full mt-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Cập Nhật Mật Khẩu
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nút hành động cuối trang */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  ← Quay lại trang chủ
                </button>
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Đăng xuất tài khoản
                  </button>
                )}
              </div>
            </div>
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
                      const comments = readJsonStorage(key, [], Array.isArray);
                      comments.forEach((c) => {
                        if (
                          c.userName === currentUser.name ||
                          c.userEmail === currentUser.email
                        ) {
                          userComments.push(c);
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
                              {item.date || "Gần đây"}
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
                <div className="relative h-[400px] sm:h-[450px] md:h-[480px] w-full bg-slate-900 overflow-hidden transition-all duration-700">
                  <img
                    key={currentBannerMovie._id}
                    src={currentBannerMovie.posterUrl}
                    alt={currentBannerMovie.title || currentBannerMovie.name}
                    className="w-full h-full object-cover opacity-35 blur-sm transition-opacity duration-1000 animate-fadeIn"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 w-full justify-between">
                      <div className="flex items-center gap-8">
                        <img
                          key={`poster-${currentBannerMovie._id}`}
                          src={currentBannerMovie.posterUrl}
                          alt={
                            currentBannerMovie.title || currentBannerMovie.name
                          }
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

                          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-wide line-clamp-2">
                            {currentBannerMovie.title ||
                              currentBannerMovie.name}
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

                      {/* Các chấm tròn điều hướng */}
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

          {/* 📍 THANH LỌC NÂNG CAO (Thể loại, Quốc gia, Năm, Sắp xếp) */}
          {activeTab === "home" && (
            <div className="max-w-7xl mx-auto px-6 pt-8 space-y-4">
              {/* Thể loại */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold mr-2 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                >
                  Thể loại:
                </span>
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

              {/* Quốc gia & Năm & Sắp xếp */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  {/* Lọc Quốc Gia */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Quốc gia:
                    </span>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-red-500 cursor-pointer ${
                        darkMode
                          ? "bg-slate-900 border-slate-800 text-slate-200"
                          : "bg-white border-gray-200 text-slate-800 shadow-sm"
                      }`}
                    >
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lọc Năm */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Năm:
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-red-500 cursor-pointer ${
                        darkMode
                          ? "bg-slate-900 border-slate-800 text-slate-200"
                          : "bg-white border-gray-200 text-slate-800 shadow-sm"
                      }`}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sắp xếp */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span
                    className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}
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
            </div>
          )}

          <main className="max-w-7xl mx-auto px-6 py-6 animate-fadeIn">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} darkMode={darkMode} />
                ))}
              </div>
            ) : activeTab === "home" && moviesError ? (
              <div
                role="alert"
                className={`text-center py-20 space-y-3 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                <p>{moviesError}</p>
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

                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={() =>
                        setVisibleCountState({
                          key: visibilityKey,
                          count: visibleCount + 10,
                        })
                      }
                      className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-2xl text-xs transition shadow-lg shadow-red-600/30 cursor-pointer transform hover:scale-105"
                    >
                      Xem thêm phim khác ({sortedMovies.length - visibleCount}{" "}
                      phim còn lại)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* 📍 Modal Đăng ký / Đăng nhập */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setProfileName(user.name || "");
          setProfileAvatar(user.avatar || "");
          setHasProfileAvatarError(false);
          showToast(`Chào mừng trở lại, ${user.name || "User"}!`, "success");
        }}
      />

      {/* 🌟 Toast Notification */}
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

export default App;
