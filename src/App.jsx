import { useState, useEffect, useCallback } from "react";
import { Play, History } from "lucide-react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import SkeletonCard from "./components/SkeletonCard";
import AuthModal from "./components/AuthModal";
import WatchPage from "./components/WatchPage";
import { API_URL } from "./utils/api";
import { readJsonStorage } from "./utils/storage";

async function prepareBannerImage(file) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  try {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create a canvas context.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    image.close();
  }
}

function App() {
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

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home", "watchlist", "history", "profile", "my-comments", "watch"

  // 🌟 State quản lý Modal VIP & Thanh toán
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [selectedVipPackage, setSelectedVipPackage] = useState("1_month");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // 🌟 Quản lý danh sách Yêu thích & Lịch sử
  const [favorites, setFavorites] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("movie_user");
    localStorage.removeItem("movie_token");
    localStorage.removeItem("movie_favorites");
    localStorage.removeItem("movie_watch_history");

    setCurrentUser(null);
    setFavorites([]);
    setWatchHistory([]);
    setActiveTab("home");

    showToast("Đã đăng xuất tài khoản thành công!", "success");
  }, [showToast]);

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

  // 🌟 State mở rộng Lọc theo Quốc gia và Năm phát hành
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
    let isCurrent = true;

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

        if (res.status === 401) {
          handleLogout();
          setIsAuthOpen(true);
          showToast(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
            "error",
          );
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (
            !Array.isArray(data.favorites) ||
            !Array.isArray(data.watchHistory)
          ) {
            throw new TypeError("User sync API returned invalid data.");
          }
          if (isCurrent) {
            setFavorites(data.favorites);
            setWatchHistory(data.watchHistory);
          }
        } else {
          throw new Error(
            `User sync request failed with status ${res.status}.`,
          );
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu từ database:", err);
      }
    };

    fetchUserDataFromDB();

    return () => {
      isCurrent = false;
    };
  }, [currentUser, handleLogout, showToast]);

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

    try {
      const token = localStorage.getItem("movie_token");
      const res = await fetch(`${API_URL}/users/favorites`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: movie._id }),
      });

      if (res.status === 401) {
        handleLogout();
        setIsAuthOpen(true);
        showToast(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
          "error",
        );
        return;
      }

      if (!res.ok) {
        throw new Error(`Favorite request failed with status ${res.status}.`);
      }

      showToast(
        exists
          ? "Đã xóa phim khỏi danh sách yêu thích"
          : "Đã thêm phim vào danh sách yêu thích ❤️",
        exists ? "error" : "success",
      );
    } catch (err) {
      console.error("Lỗi lưu yêu thích lên server:", err);
      setFavorites((currentFavorites) =>
        exists
          ? currentFavorites.some((item) => item._id === movie._id)
            ? currentFavorites
            : [...currentFavorites, movie]
          : currentFavorites.filter((item) => item._id !== movie._id),
      );
      showToast(
        "Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.",
        "error",
      );
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
        const res = await fetch(`${API_URL}/users/history`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId: movie._id }),
        });

        if (res.status === 401) {
          handleLogout();
          setIsAuthOpen(true);
          showToast(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
            "error",
          );
          return;
        }

        if (!res.ok) {
          throw new Error(
            `Watch history request failed with status ${res.status}.`,
          );
        }
      } catch (err) {
        console.error("Lỗi lưu lịch sử lên server:", err);
        showToast("Không thể đồng bộ lịch sử xem với máy chủ.", "error");
      }
    },
    [currentUser, handleLogout, showToast],
  );

  const handleUpdateProfileDirectly = async (
    newName,
    newAvatar,
    newBio,
    newBannerUrl,
  ) => {
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
          bio: newBio,
          bannerUrl: newBannerUrl,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        setIsAuthOpen(true);
        showToast(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
          "error",
        );
        return;
      }

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

  // 🌟 Hàm xử lý gửi yêu cầu nâng cấp VIP chờ Admin duyệt
  const handleUpgradeVip = async () => {
    setIsProcessingPayment("loading");
    try {
      const token = localStorage.getItem("movie_token");
      const res = await fetch(`${API_URL}/users/request-vip`, {
        method: "POST", // 🌟 Sửa từ PUT thành POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageType: selectedVipPackage }),
      });

      const data = await res.json();
      setIsProcessingPayment(false);
      setIsVipModalOpen(false);

      if (res.ok) {
        showToast("⏳ " + data.message, "success");
      } else {
        showToast(data.message || "Không thể gửi yêu cầu!", "error");
      }
    } catch {
      setIsProcessingPayment(false);
      showToast("Lỗi kết nối đến máy chủ!", "error");
    }
  };

  const handleOpenWatchPage = (movie) => {
    // 🌟 Kiểm tra nếu phim yêu cầu VIP nhưng user chưa mua VIP
    if (movie.isVipOnly && !currentUser?.isVip) {
      showToast("⭐ Bộ phim này chỉ dành riêng cho tài khoản VIP!", "error");
      setIsVipModalOpen(true); // Tự động bật Modal chọn gói VIP lên
      return;
    }

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
      return (b.rating ?? 5) - (a.rating ?? 5);
    } else {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const currentMovies = sortedMovies.slice(0, visibleCount);
  const hasMore = visibleCount < sortedMovies.length;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-slate-900"
      }`}
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
          allMovies={movies}
          onSelectMovie={handleOpenWatchPage}
          darkMode={darkMode}
        />
      ) : activeTab === "profile" ? (
        <div className="max-w-5xl mx-auto px-6 py-10 animate-fadeIn">
          <div
            className={`${
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-gray-200 text-slate-900 shadow-xl"
            } border rounded-3xl overflow-hidden transition-colors`}
          >
            {/* 🌟 NÂNG CẤP BANNER: Cho phép đổi ảnh bìa nền */}
            <div
              className="h-52 relative overflow-hidden bg-cover bg-center transition-all duration-500 group/banner"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${
                  currentUser?.bannerUrl ||
                  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200"
                })`,
              }}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() =>
                    document.getElementById("bannerBgInput").click()
                  }
                  className="bg-black/50 hover:bg-black/80 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-lg"
                >
                  🖼️ Đổi ảnh bìa
                </button>
                <input
                  type="file"
                  id="bannerBgInput"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    input.value = "";
                    if (!file) return;

                    try {
                      const bannerUrl = await prepareBannerImage(file);
                      await handleUpdateProfileDirectly(
                        currentUser?.name,
                        currentUser?.avatar,
                        currentUser?.bio,
                        bannerUrl,
                      );
                    } catch (error) {
                      console.error("Lỗi xử lý ảnh bìa:", error);
                      showToast(
                        "Không thể xử lý ảnh bìa. Vui lòng chọn ảnh khác!",
                        "error",
                      );
                    }
                  }}
                />
              </div>

              {/* Thông tin Avatar & Tên */}
              <div className="absolute bottom-4 left-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full pr-10">
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
                        await handleUpdateProfileDirectly(
                          currentUser?.name,
                          reader.result,
                          currentUser?.bio,
                          currentUser?.bannerUrl,
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                <div className="text-white drop-shadow-md space-y-1 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="text"
                      defaultValue={currentUser?.name || ""}
                      onBlur={async (e) => {
                        const newName = e.target.value.trim();
                        if (newName && newName !== currentUser?.name) {
                          await handleUpdateProfileDirectly(
                            newName,
                            currentUser?.avatar,
                            currentUser?.bio,
                            currentUser?.bannerUrl,
                          );
                        }
                      }}
                      className="bg-transparent hover:bg-white/10 focus:bg-slate-900/80 px-2.5 py-1 rounded-xl text-2xl font-extrabold focus:outline-none focus:ring-2 focus:ring-red-500 transition w-full sm:w-auto max-w-xs"
                      placeholder="Nhập tên của bạn..."
                    />

                    {/* Huy hiệu hiển thị theo trạng thái VIP thực tế */}
                    <span
                      className={`font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1 ${
                        currentUser?.isVip
                          ? "bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {currentUser?.isVip
                        ? "👑 VIP Diamond"
                        : "⭐ Thành Viên Thường"}
                    </span>

                    <span className="text-xs bg-black/40 px-2.5 py-1 rounded-md text-slate-300 hidden sm:inline-block backdrop-blur-sm">
                      ✏️ Bấm vào tên để sửa
                    </span>
                  </div>

                  <p className="text-xs text-white/80 px-2.5">
                    {currentUser?.email}
                  </p>

                  {/* Tiểu sử (Bio) */}
                  <div className="px-2.5 pt-1">
                    <input
                      type="text"
                      defaultValue={
                        currentUser?.bio ||
                        "✨ Đam mê điện ảnh, thích xem phim hành động và khoa học viễn tưởng..."
                      }
                      onBlur={async (e) => {
                        const newBio = e.target.value.trim();
                        if (newBio !== currentUser?.bio) {
                          await handleUpdateProfileDirectly(
                            currentUser?.name,
                            currentUser?.avatar,
                            newBio,
                            currentUser?.bannerUrl,
                          );
                        }
                      }}
                      className="bg-transparent hover:bg-white/10 focus:bg-slate-900/80 px-2 py-0.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 transition w-full max-w-md"
                      placeholder="Nhập tiểu sử ngắn của bạn..."
                      title="Bấm để sửa tiểu sử"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 mt-2">
              {/* 🌟 THẺ THÀNH VIÊN VIP (TỰ ĐỘNG THAY ĐỔI THEO TRẠNG THÁI TÀI KHOẢN) */}
              <div
                className={`relative p-6 rounded-3xl text-white shadow-2xl overflow-hidden border ${
                  currentUser?.isVip
                    ? "bg-linear-to-r from-amber-600 via-yellow-600 to-amber-700 border-yellow-400/30"
                    : "bg-linear-to-r from-slate-800 via-slate-900 to-slate-950 border-slate-700"
                }`}
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-widest border ${
                          currentUser?.isVip
                            ? "bg-black/30 text-yellow-300 border-yellow-300/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {currentUser?.isVip
                          ? "👑 VIP Diamond Member"
                          : "⭐ Thành Viên Thường"}
                      </span>
                      <span className="text-xs text-slate-300">
                        Trạng thái:{" "}
                        {currentUser?.isVip
                          ? "Đang hoạt động"
                          : "Chưa kích hoạt"}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold tracking-wide pt-1">
                      {currentUser?.isVip
                        ? "Tài khoản xem phim không giới hạn 4K"
                        : "Nâng cấp VIP để mở khóa kho phim độc quyền"}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {currentUser?.isVip
                        ? "Bạn đang tận hưởng trọn vẹn đặc quyền xem phim không quảng cáo."
                        : "Xem phim bom tấn chất lượng cao, không bị làm phiền bởi quảng cáo."}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVipModalOpen(true)}
                    className={`px-6 py-3 font-bold rounded-2xl text-xs transition shadow-xl cursor-pointer transform hover:scale-105 whitespace-nowrap ${
                      currentUser?.isVip
                        ? "bg-slate-950 hover:bg-slate-900 text-yellow-400 border border-yellow-400/40"
                        : "bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/30"
                    }`}
                  >
                    {currentUser?.isVip
                      ? "✨ Quản Lý Gói VIP"
                      : "🚀 Nâng Cấp VIP Ngay"}
                  </button>
                </div>
              </div>

              {/* Chọn nhanh avatar mẫu */}
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode
                    ? "bg-slate-800/30 border-slate-800"
                    : "bg-gray-50 border-gray-200"
                } flex flex-col sm:flex-row items-center justify-between gap-4`}
              >
                <span
                  className={`text-xs font-medium ${
                    darkMode ? "text-slate-300" : "text-gray-700"
                  }`}
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
                          currentUser?.bio,
                          currentUser?.bannerUrl,
                        );
                      }}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 hover:border-red-500 cursor-pointer transition transform hover:scale-110 shadow-md"
                      title="Bấm để đổi sang ảnh này"
                    />
                  ))}
                </div>
              </div>

              {/* Thống kê chi tiết */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode
                      ? "bg-slate-800/40 border-slate-800"
                      : "bg-gray-50 border-gray-200"
                  } flex items-center justify-between`}
                >
                  <div>
                    <span
                      className={`text-xs block font-medium ${
                        darkMode ? "text-slate-400" : "text-gray-500"
                      }`}
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
                  className={`p-5 rounded-2xl border ${
                    darkMode
                      ? "bg-slate-800/40 border-slate-800"
                      : "bg-gray-50 border-gray-200"
                  } flex items-center justify-between`}
                >
                  <div>
                    <span
                      className={`text-xs block font-medium ${
                        darkMode ? "text-slate-400" : "text-gray-500"
                      }`}
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

                <div
                  className={`p-5 rounded-2xl border ${
                    darkMode
                      ? "bg-slate-800/40 border-slate-800"
                      : "bg-gray-50 border-gray-200"
                  } flex items-center justify-between`}
                >
                  <div>
                    <span
                      className={`text-xs block font-medium ${
                        darkMode ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      Cấp độ tài khoản
                    </span>
                    <span className="text-xl font-bold text-emerald-500 mt-1 inline-block">
                      {currentUser?.isVip ? "VIP Diamond" : "Thành Viên Thường"}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl font-bold">
                    ⭐
                  </div>
                </div>
              </div>

              {/* Đổi mật khẩu */}
              {currentUser && (
                <div className="grid grid-cols-1 gap-8 max-w-xl mx-auto">
                  <div
                    className={`p-6 rounded-2xl border space-y-4 ${
                      darkMode
                        ? "bg-slate-800/20 border-slate-800"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                      🔒 Đổi Mật Khẩu Tài Khoản
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${
                            darkMode ? "text-slate-400" : "text-gray-600"
                          }`}
                        >
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="oldPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-white"
                              : "bg-white border-gray-300 text-slate-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${
                            darkMode ? "text-slate-400" : "text-gray-600"
                          }`}
                        >
                          Mật khẩu mới (tối thiểu 6 ký tự)
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="newPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-white"
                              : "bg-white border-gray-300 text-slate-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs mb-1 font-medium ${
                            darkMode ? "text-slate-400" : "text-gray-600"
                          }`}
                        >
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          id="confirmPasswordInput"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-white"
                              : "bg-white border-gray-300 text-slate-900"
                          }`}
                        />
                      </div>

                      <button
                        onClick={async () => {
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

                          try {
                            const token = localStorage.getItem("movie_token");
                            const res = await fetch(
                              `${API_URL}/users/change-password`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  oldPassword: oldPass,
                                  newPassword: newPass,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (res.ok) {
                              showToast(
                                "✨ Đổi mật khẩu thành công!",
                                "success",
                              );
                              document.getElementById(
                                "oldPasswordInput",
                              ).value = "";
                              document.getElementById(
                                "newPasswordInput",
                              ).value = "";
                              document.getElementById(
                                "confirmPasswordInput",
                              ).value = "";
                            } else {
                              showToast(
                                data.message || "Đổi mật khẩu thất bại!",
                                "error",
                              );
                            }
                          } catch {
                            showToast("Lỗi kết nối máy chủ!", "error");
                          }
                        }}
                        className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-red-600/20"
                      >
                        Cập Nhật Mật Khẩu Mới
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
              className={`text-2xl font-bold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
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
              className={`text-center py-20 space-y-4 ${
                darkMode ? "text-slate-400" : "text-gray-500"
              }`}
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
            className={`${
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-gray-200 text-slate-900 shadow-xl"
            } border rounded-2xl p-8 space-y-6`}
          >
            <h2 className="text-2xl font-bold flex items-center gap-3 text-red-500">
              💬 Bình Luận & Đánh Giá Của Bạn
            </h2>

            {!currentUser ? (
              <p
                className={`text-xs ${
                  darkMode ? "text-slate-400" : "text-gray-500"
                }`}
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
                        className={`text-center py-12 space-y-3 ${
                          darkMode ? "text-slate-400" : "text-gray-500"
                        }`}
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
                          className={`p-4 rounded-xl border space-y-1 ${
                            darkMode
                              ? "bg-slate-800/40 border-slate-700/50"
                              : "bg-gray-50 border-gray-200"
                          }`}
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
                <div className="relative h-100 sm:h-112.5 md:h-120 w-full bg-slate-900 overflow-hidden transition-all duration-700">
                  <img
                    key={currentBannerMovie._id}
                    src={currentBannerMovie.posterUrl}
                    alt={currentBannerMovie.title || currentBannerMovie.name}
                    className="w-full h-full object-cover opacity-35 blur-sm transition-opacity duration-1000 animate-fadeIn"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center">
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

          {/* 📍 THANH LỌC NÂNG CAO */}
          {activeTab === "home" && (
            <div className="max-w-7xl mx-auto px-6 pt-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold mr-2 ${
                    darkMode ? "text-slate-400" : "text-gray-500"
                  }`}
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
                        ? "bg-linear-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                        : darkMode
                          ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                          : "bg-white text-slate-600 hover:bg-gray-100 border border-gray-200 shadow-sm"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        darkMode ? "text-slate-400" : "text-gray-500"
                      }`}
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

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        darkMode ? "text-slate-400" : "text-gray-500"
                      }`}
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

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span
                    className={`text-xs font-medium ${
                      darkMode ? "text-slate-400" : "text-gray-500"
                    }`}
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
                className={`text-xl font-bold flex items-center gap-2 ${
                  darkMode ? "text-slate-100" : "text-slate-800"
                }`}
              >
                {activeTab === "home" &&
                  `🎬 Danh Sách Phim ${
                    selectedCategory !== "Tất cả" ? `- ${selectedCategory}` : ""
                  }`}
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
                className={`text-center py-20 space-y-3 ${
                  darkMode ? "text-slate-400" : "text-gray-500"
                }`}
              >
                <p>{moviesError}</p>
              </div>
            ) : currentMovies.length === 0 ? (
              <div
                className={`text-center py-20 space-y-3 ${
                  darkMode ? "text-slate-500" : "text-gray-400"
                }`}
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
                      currentUser={currentUser}
                      a
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
                      className="px-8 py-3 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-2xl text-xs transition shadow-lg shadow-red-600/30 cursor-pointer transform hover:scale-105"
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

      {/* 🌟 MODAL CHỌN GÓI VIP & QUÉT MÃ QR THANH TOÁN */}
      {isVipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div
            className={`relative w-full max-w-xl rounded-3xl p-8 shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-gray-200 text-slate-900"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold flex items-center gap-2 text-yellow-500">
                👑{" "}
                {isProcessingPayment === "qr"
                  ? "Quét Mã QR Thanh Toán"
                  : "Nâng Cấp Tài Khoản VIP"}
              </h3>
              <button
                onClick={() => !isProcessingPayment && setIsVipModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isProcessingPayment === "loading" ? (
              <div className="py-16 text-center space-y-4">
                <div className="inline-block w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-yellow-400">
                  Đang xử lý giao dịch và kích hoạt VIP...
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng không tắt trình duyệt.
                </p>
              </div>
            ) : isProcessingPayment === "qr" ? (
              /* 💳 GIAO DIỆN QUÉT MÃ QR VIETQR CÁ NHÂN */
              <div className="space-y-4 text-center">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-xl border-4 border-yellow-500">
                  <img
                    src={`https://img.vietqr.io/image/MB-4268611581729-compact2.png?amount=${
                      selectedVipPackage === "1_month"
                        ? "49000"
                        : selectedVipPackage === "6_months"
                          ? "249000"
                          : "599000"
                    }&addInfo=VIP%20${currentUser?.email || ""}`}
                    alt="VietQR NGUYEN MINH TU"
                    className="w-48 h-48 mx-auto object-contain rounded-lg"
                  />
                </div>

                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700 text-left space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="font-bold text-yellow-400 uppercase">
                      NGUYEN MINH TU
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <span className="font-bold text-white select-all">
                      4268611581729
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tiền:</span>
                    <span className="font-bold text-emerald-400">
                      {selectedVipPackage === "1_month"
                        ? "49.000đ"
                        : selectedVipPackage === "6_months"
                          ? "249.000đ"
                          : "599.000đ"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <span className="font-bold text-pink-400 select-all">
                      VIP {currentUser?.email}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setIsProcessingPayment(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Quay lại chọn gói
                  </button>
                  <button
                    onClick={handleUpgradeVip}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    ✅ Tôi đã thanh toán xong
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">
                  Chọn gói cước phù hợp để mở khóa toàn bộ kho phim 4K độc
                  quyền, không quảng cáo và tốc độ cao.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: "1_month",
                      name: "Gói 1 Tháng",
                      price: "49.000đ",
                      desc: "Trải nghiệm linh hoạt",
                    },
                    {
                      id: "6_months",
                      name: "Gói 6 Tháng",
                      price: "249.000đ",
                      desc: "Tiết kiệm 15%",
                    },
                    {
                      id: "lifetime",
                      name: "Trọn Đời (Diamond)",
                      price: "599.000đ",
                      desc: "Đặc quyền vĩnh viễn",
                      popular: true,
                    },
                  ].map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedVipPackage(pkg.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        selectedVipPackage === pkg.id
                          ? "border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-500/50 shadow-lg"
                          : darkMode
                            ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 right-3 bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Hot nhất
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-bold block text-yellow-500">
                          {pkg.name}
                        </span>
                        <span className="text-lg font-extrabold mt-1 block">
                          {pkg.price}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-2 block">
                        {pkg.desc}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Trạng thái hiện tại:{" "}
                    <span className="text-emerald-400 font-semibold">
                      {currentUser?.isVip ? "Đang là VIP" : "Thành viên thường"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsProcessingPayment("qr")}
                    className="px-8 py-3 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold rounded-2xl text-xs transition shadow-lg shadow-yellow-500/20 cursor-pointer transform hover:scale-105 flex items-center gap-2"
                  >
                    💳 Thanh Toán Qua QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📍 Modal Đăng ký / Đăng nhập */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
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
