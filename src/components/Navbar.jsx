import { useState, useRef, useEffect } from "react";
import {
  Film,
  Search,
  X,
  LogIn,
  LogOut,
  Heart,
  History,
  Sun,
  Moon,
  Play,
} from "lucide-react";

function Navbar({
  searchTerm,
  setSearchTerm,
  currentUser,
  onOpenAuth,
  onLogout,
  favoriteCount,
  historyCount,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  movies = [], // Truyền danh sách phim vào Navbar để làm gợi ý nhanh
  onSelectMovie, // Hàm mở trang xem phim khi click vào gợi ý
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Lọc danh sách phim gợi ý dựa theo từ khóa tìm kiếm
  const searchSuggestions =
    searchTerm.trim() === ""
      ? []
      : movies
          .filter((m) =>
            m.title.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .slice(0, 5); // Hiển thị tối đa 5 kết quả gợi ý

  // Đóng ô tìm kiếm và danh sách gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (!searchTerm) {
          setIsSearchOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchTerm]);

  return (
    <nav
      className={`${
        darkMode
          ? "bg-slate-900/90 border-slate-800 text-white"
          : "bg-white/90 border-slate-200 text-slate-900"
      } backdrop-blur-md border-b sticky top-0 z-50 px-6 py-4 transition-colors`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-2 text-red-500 font-bold text-2xl tracking-wider cursor-pointer"
        >
          <Film className="w-8 h-8" />
          <span>CINEMA-STREAM</span>
        </div>

        {/* 🌟 Thanh Tìm Kiếm Mở Rộng + Gợi Ý Nhanh (Instant Search) */}
        <div ref={searchRef} className="relative">
          <div
            onClick={() => {
              if (!isSearchOpen) setIsSearchOpen(true);
            }}
            className={`flex items-center transition-all duration-300 rounded-full border cursor-pointer ${
              isSearchOpen || searchTerm
                ? "w-64 sm:w-80 px-3.5 py-2 bg-slate-900/95 border-red-500 shadow-xl shadow-red-600/20"
                : "w-11 h-11 justify-center " +
                  (darkMode
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    : "bg-slate-100 border-slate-300 hover:bg-slate-200")
            }`}
          >
            <Search
              className={`w-5 h-5 transition-colors shrink-0 ${
                isSearchOpen || searchTerm
                  ? "text-red-500 mr-2"
                  : darkMode
                    ? "text-slate-400"
                    : "text-slate-500"
              }`}
            />

            {(isSearchOpen || searchTerm) && (
              <input
                type="text"
                placeholder="Tìm kiếm phim, diễn viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-400"
              />
            )}

            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                className="text-slate-400 hover:text-white ml-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 📍 Dropdown hiển thị kết quả gợi ý nhanh giống Netflix/VieON */}
          {searchTerm && isSearchOpen && (
            <div
              className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-fadeIn ${
                darkMode
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-gray-200 text-slate-900"
              }`}
            >
              <div className="p-2.5 border-b border-slate-800/60 text-[11px] font-semibold text-slate-400 flex justify-between items-center">
                <span>GỢI Ý TỪ KHÓA & PHIM</span>
                <span>{searchSuggestions.length} kết quả</span>
              </div>

              {searchSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy bộ phim phù hợp với "{searchTerm}"
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40">
                  {searchSuggestions.map((movie) => (
                    <div
                      key={movie._id}
                      onClick={() => {
                        if (onSelectMovie) onSelectMovie(movie);
                        setIsSearchOpen(false);
                      }}
                      className={`flex items-center gap-3 p-2.5 transition cursor-pointer ${
                        darkMode ? "hover:bg-slate-800/80" : "hover:bg-gray-100"
                      }`}
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">
                          {movie.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded font-medium">
                            {movie.category || "Phim"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {movie.releaseYear || 2024}
                          </span>
                        </div>
                      </div>
                      <Play className="w-4 h-4 text-red-500 fill-red-500 shrink-0 opacity-80" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Khu vực bên phải (Theme, Yêu thích, Lịch sử, User) */}
        <div className="flex items-center gap-3">
          {/* Nút Đổi Dark / Light Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition cursor-pointer ${
              darkMode
                ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                : "bg-slate-100 text-amber-500 hover:bg-slate-200"
            }`}
            title={
              darkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"
            }
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Nút Yêu thích */}
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === "watchlist"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="hidden sm:inline">Yêu thích</span>
            {favoriteCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Nút Lịch sử */}
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === "history"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Lịch sử</span>
            {historyCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* User / Đăng nhập */}
          <div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-red-600 text-white"
                      : darkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>👋 {currentUser.name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    darkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full text-sm transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
