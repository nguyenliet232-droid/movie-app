import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Clock3,
  Download,
  Film,
  Heart,
  LogOut,
  Search,
  Smartphone,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

const mainLinks = [
  { label: "Trang chủ", href: "#top", view: "home" },
  { label: "Phim mới", href: "#newest", view: "home" },
  { label: "Phim lẻ", href: "#popular", view: "home" },
  { label: "Phim bộ", href: "#genres", view: "home" },
  { label: "TV Show", href: "#movie-rows", view: "home" },
  { label: "Thiếu nhi", href: "#kids", category: "Hoạt hình" },
];

export default function Navbar({
  categories,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  countries,
  years,
  selectedCountry,
  onSelectCountry,
  selectedYear,
  onSelectYear,
  sortBy,
  onSelectSort,
  activeView,
  onSelectView,
  currentUser,
  onRequestLogin,
  onLogout,
  onRequestVip,
  recentMovies,
  favoriteCount,
}) {
  const [openPanel, setOpenPanel] = useState("");
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const selectHome = (link) => {
    onSelectView("home");
    onSearchChange("");
    onSelectCategory(link.category || "Tất cả");
    setOpenPanel("");
    if (link.label === "Trang chủ") {
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    } else {
      document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const submitCode = (event) => {
    event.preventDefault();
    setCodeMessage(
      code.trim()
        ? "Máy chủ Movie App chưa hỗ trợ kiểm tra mã. Mã chưa được áp dụng."
        : "Vui lòng nhập mã trước khi tiếp tục.",
    );
  };

  return (
    <header id="top" className="movie-navbar">
      <div className="movie-navbar__main">
        <a
          className="movie-brand"
          href="#top"
          aria-label="Movie App - Trang chủ"
          onClick={() => selectHome(mainLinks[0])}
        >
          <Film size={28} strokeWidth={2.2} />
          <span>
            MOVIE<span>APP</span>
          </span>
        </a>

        <nav className="movie-navbar__links" aria-label="Điều hướng chính">
          {mainLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              className={index === 0 && activeView === "home" ? "is-active" : ""}
              onClick={(event) => {
                event.preventDefault();
                selectHome(link);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="movie-navbar__utility">
          <button
            type="button"
            className="movie-navbar__vip"
            onClick={() => {
              setOpenPanel("");
              onRequestVip();
            }}
          >
            <span className="movie-navbar__vip-full">ĐẶC QUYỀN VIP</span>
            <span className="movie-navbar__vip-short">VIP</span>
          </button>
          <div className="movie-navbar__panel-anchor">
            <button
              type="button"
              className="movie-navbar__voucher-trigger"
              onClick={() => setOpenPanel(openPanel === "voucher" ? "" : "voucher")}
            >
              Nhập mã <span className="movie-navbar__voucher-full">Movie App</span>
            </button>
            {openPanel === "voucher" && (
              <div className="movie-navbar__popover movie-navbar__popover--voucher">
                <div className="movie-navbar__popover-heading">
                  <strong>Nhập mã ưu đãi</strong>
                  <button type="button" onClick={() => setOpenPanel("")} aria-label="Đóng">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={submitCode}>
                  <label htmlFor="voucher-code">Mã ưu đãi</label>
                  <input
                    id="voucher-code"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value);
                      setCodeMessage("");
                    }}
                    placeholder="Nhập mã của bạn"
                  />
                  <button type="submit">Kiểm tra mã</button>
                </form>
                {codeMessage && <p role="status">{codeMessage}</p>}
              </div>
            )}
          </div>
          <label
            className={
              searchOpen || searchTerm
                ? "movie-search is-expanded"
                : "movie-search"
            }
          >
            <button
              type="button"
              className="movie-search__toggle"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm nội dung"}
            >
              <Search size={20} aria-hidden="true" />
            </button>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm phim..."
              aria-label="Tìm phim"
            />
          </label>
          <div className="movie-navbar__panel-anchor movie-navbar__desktop-only">
            <button
              type="button"
              className="movie-navbar__icon-button"
              onClick={() => setOpenPanel(openPanel === "app" ? "" : "app")}
              aria-label="Tải ứng dụng"
              aria-expanded={openPanel === "app"}
            >
              <Download size={19} />
            </button>
            {openPanel === "app" && (
              <div className="movie-navbar__popover movie-navbar__popover--app">
                <Smartphone size={22} />
                <strong>Movie App trên điện thoại</strong>
                <p>Mở trang này bằng trình duyệt di động rồi chọn “Thêm vào màn hình chính”.</p>
              </div>
            )}
          </div>
          <div className="movie-navbar__panel-anchor">
            <button
              type="button"
              className="movie-navbar__icon-button"
              onClick={() => setOpenPanel(openPanel === "notifications" ? "" : "notifications")}
              aria-label="Thông báo"
              aria-expanded={openPanel === "notifications"}
            >
              <Bell size={19} />
              {recentMovies.length > 0 && <span className="movie-navbar__notification-dot" />}
            </button>
            {openPanel === "notifications" && (
              <div className="movie-navbar__popover movie-navbar__popover--notifications">
                <div className="movie-navbar__popover-heading">
                  <strong>Thông báo</strong>
                  <button type="button" onClick={() => setOpenPanel("")} aria-label="Đóng">
                    <X size={16} />
                  </button>
                </div>
                {recentMovies.length > 0 ? (
                  recentMovies.slice(0, 3).map((movie) => (
                    <p key={movie._id}>
                      Đã thêm <strong>{movie.title}</strong> vào mục Đang xem.
                    </p>
                  ))
                ) : (
                  <p>Chưa có thông báo mới.</p>
                )}
              </div>
            )}
          </div>
          <div className="movie-navbar__panel-anchor">
            {currentUser ? (
              <>
                <button
                  type="button"
                  className="movie-navbar__account-button"
                  onClick={() => setOpenPanel(openPanel === "profile" ? "" : "profile")}
                  aria-label={`Tài khoản ${currentUser.name || currentUser.email}`}
                  aria-expanded={openPanel === "profile"}
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" />
                  ) : (
                    <UserRound size={19} />
                  )}
                  <ChevronDown size={13} />
                </button>
                {openPanel === "profile" && (
                  <div className="movie-navbar__popover movie-navbar__popover--profile">
                    <strong>{currentUser.name || "Tài khoản Movie App"}</strong>
                    <span>{currentUser.email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectView("profile");
                        setOpenPanel("");
                      }}
                    >
                      Hồ sơ cá nhân
                    </button>
                    <button type="button" onClick={onLogout}>
                      <LogOut size={15} /> Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                className="movie-navbar__account-button"
                onClick={onRequestLogin}
                aria-label="Đăng nhập"
              >
                <UserRound size={19} />
              </button>
            )}
          </div>
        </div>

        <div className="movie-navbar__mobile-actions">
          <button type="button" onClick={() => onRequestVip()} aria-label="Đặc quyền VIP">
            <Ticket size={17} />
          </button>
          <button
            type="button"
            onClick={() => onSelectView("favorites")}
            aria-label={`Danh sách của tôi, ${favoriteCount} phim`}
          >
            <Heart size={18} />
          </button>
          <button type="button" onClick={onRequestLogin} aria-label="Tài khoản">
            <UserRound size={18} />
          </button>
        </div>
      </div>

      <nav className="movie-navbar__subnav" aria-label="Thể loại phim">
        <div className="movie-navbar__subnav-inner">
          <span className="movie-navbar__subnav-label">Khám phá</span>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={selectedCategory === category ? "is-active" : ""}
              onClick={() => {
                onSelectView("home");
                onSelectCategory(category);
                document.getElementById("movie-rows")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {category}
            </button>
          ))}
          <button
            type="button"
            className={activeView === "favorites" ? "is-active" : ""}
            onClick={() => onSelectView("favorites")}
          >
            <Heart size={14} /> Danh sách của tôi
          </button>
          <button
            type="button"
            className={activeView === "history" ? "is-active" : ""}
            onClick={() => onSelectView("history")}
          >
            <Clock3 size={14} /> Đang xem
          </button>
        </div>
      </nav>
      <div className="movie-navbar__filters" aria-label="Bộ lọc phim">
        <label>
          Quốc gia
          <select
            value={selectedCountry}
            onChange={(event) => onSelectCountry(event.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label>
          Năm
          <select
            value={selectedYear}
            onChange={(event) => onSelectYear(event.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label>
          Sắp xếp
          <select value={sortBy} onChange={(event) => onSelectSort(event.target.value)}>
            <option value="popular">Mới nhất</option>
            <option value="rating">Đánh giá cao</option>
            <option value="title">Tên A–Z</option>
          </select>
        </label>
      </div>
    </header>
  );
}
