import { Film, Search, LogIn, LogOut } from "lucide-react";

function Navbar({
  searchTerm,
  setSearchTerm,
  currentUser,
  onOpenAuth,
  onLogout,
}) {
  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 text-red-500 font-bold text-2xl tracking-wider cursor-pointer">
          <Film className="w-8 h-8" />
          <span>CINEMA-STREAM</span>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {/* User Info / Nút Đăng nhập */}
        <div>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">
                👋 {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full text-sm transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
