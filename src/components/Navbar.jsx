import {
  Film,
  Search,
  LogIn,
  LogOut,
  Heart,
  History,
  Sun,
  Moon,
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
}) {
  return (
    <nav
      className={`${darkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white/80 border-slate-200 text-slate-900"} backdrop-blur-md border-b sticky top-0 z-40 px-6 py-4 transition-colors`}
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

        {/* Ô Tìm kiếm */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search
            className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
          />
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500 transition ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-slate-100 border-slate-300 text-slate-900"
            }`}
          />
        </div>

        {/* Khu vực bên phải */}
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
                  className={`p-2 rounded-full transition cursor-pointer ${darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
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
