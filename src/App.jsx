import { useEffect, useMemo, useState } from "react";
import { Info, Play } from "lucide-react";
import AuthModal from "./components/AuthModal";
import MovieDetailModal from "./components/MovieDetailModal";
import MovieRow from "./components/MovieRow";
import Navbar from "./components/Navbar";
import VipModal from "./components/VipModal";
import { API_URL, TMDB_API_KEY } from "./utils/api";
import fallbackMovies, { normalizeMovie } from "./utils/fallbackMovies";
import { readJsonStorage, writeJsonStorage } from "./utils/storage";

const categories = [
  "Tất cả",
  "Hành động",
  "Tình cảm",
  "Hoạt hình",
  "Kinh dị",
  "Khoa học viễn tưởng",
];

function mapTmdbMovie(movie, index) {
  const genreMap = {
    28: "Hành động",
    12: "Hành động",
    35: "Tình cảm",
    18: "Tình cảm",
    10749: "Tình cảm",
    16: "Hoạt hình",
    27: "Kinh dị",
    878: "Khoa học viễn tưởng",
    53: "Hành động",
    14: "Khoa học viễn tưởng",
  };
  const category =
    movie.genre_ids?.map((id) => genreMap[id]).find(Boolean) || "Hành động";

  return normalizeMovie(
    {
      _id: String(movie.id || `tmdb-${index}`),
      title: movie.title || movie.name || "Phim mới",
      description: movie.overview || "Khám phá bộ phim đang được yêu thích.",
      category,
      country: movie.original_language === "vi" ? "Việt Nam" : "Quốc tế",
      releaseYear: movie.release_date
        ? Number(movie.release_date.slice(0, 4))
        : 2024,
      rating: movie.vote_average ?? 0,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "",
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : "",
    },
    index,
  );
}

function App() {
  const [movies, setMovies] = useState(fallbackMovies);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedCountry, setSelectedCountry] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("popular");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeView, setActiveView] = useState("home");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() =>
    readJsonStorage(
      "movie_user",
      null,
      (value) => value === null || (typeof value === "object" && !Array.isArray(value)),
    ),
  );
  const [profileName, setProfileName] = useState(() =>
    readJsonStorage("movie_user", null)?.name || "",
  );
  const [profileBio, setProfileBio] = useState(() =>
    readJsonStorage("movie_user", null)?.bio || "",
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    readJsonStorage("movie_favorites", [], Array.isArray),
  );
  const [watchHistory, setWatchHistory] = useState(() =>
    readJsonStorage("movie_history", [], Array.isArray),
  );

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      try {
        let nextMovies = [];
        if (TMDB_API_KEY) {
          const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`,
            { headers: { Accept: "application/json" } },
          );
          if (!response.ok) {
            throw new Error(`Movie request failed with status ${response.status}.`);
          }
          const data = await response.json();
          if (!Array.isArray(data.results)) {
            throw new TypeError("Movie catalogue returned an invalid response.");
          }
          nextMovies = data.results.map(mapTmdbMovie);
        } else {
          const response = await fetch(`${API_URL}/movies`);
          if (!response.ok) {
            throw new Error(`Movie request failed with status ${response.status}.`);
          }
          const data = await response.json();
          if (!Array.isArray(data)) {
            throw new TypeError("Movie catalogue returned an invalid response.");
          }
          nextMovies = data.map((movie, index) => normalizeMovie(movie, index));
        }

        if (active && nextMovies.length > 0) setMovies(nextMovies);
      } catch (error) {
        console.error("Could not load the movie catalogue; using sample titles.", error);
      }
    }

    loadMovies();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("movie_token");
    if (!currentUser || !token) return undefined;

    async function syncAccount() {
      try {
        const response = await fetch(`${API_URL}/users/sync-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          if (active) {
            localStorage.removeItem("movie_token");
            localStorage.removeItem("movie_user");
            setCurrentUser(null);
            setProfileName("");
            setProfileBio("");
            setActiveView("home");
            setIsAuthOpen(true);
          }
          return;
        }
        if (!response.ok) {
          throw new Error(`Account sync failed with status ${response.status}.`);
        }
        const data = await response.json();
        if (!Array.isArray(data.favorites) || !Array.isArray(data.watchHistory)) {
          throw new TypeError("Account sync returned invalid movie lists.");
        }
        if (!active) return;

        const serverFavorites = data.favorites.filter(
          (movie) => movie && typeof movie === "object" && typeof movie._id === "string",
        );
        const serverFavoriteIds = new Set(serverFavorites.map((movie) => movie._id));
        const removedFavoriteIds = readJsonStorage(
          "movie_removed_favorites",
          [],
          (value) => Array.isArray(value) && value.every((id) => typeof id === "string"),
        ).filter((id) => serverFavoriteIds.has(id));
        const removedFavoriteIdSet = new Set(removedFavoriteIds);
        const localFavorites = readJsonStorage("movie_favorites", [], Array.isArray);
        const merged = new Map(
          serverFavorites.map((movie) => [movie._id, movie]),
        );
        for (const movie of localFavorites) {
          if (movie && typeof movie === "object" && typeof movie._id === "string") {
            merged.set(movie._id, merged.get(movie._id) || movie);
          }
        }
        const nextFavorites = [...merged.values()].filter(
          (movie) => !removedFavoriteIdSet.has(movie._id),
        );
        setFavorites(nextFavorites);
        setWatchHistory(data.watchHistory);
        writeJsonStorage("movie_favorites", nextFavorites);
        writeJsonStorage("movie_history", data.watchHistory);
        writeJsonStorage("movie_removed_favorites", removedFavoriteIds);
      } catch (error) {
        console.error("Could not sync Movie App account data.", error);
      }
    }

    syncAccount();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const visibleMovies = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    const filtered = movies.filter((movie) => {
      const matchesCategory =
        selectedCategory === "Tất cả" || movie.category === selectedCategory;
      const matchesCountry =
        selectedCountry === "Tất cả" || movie.country === selectedCountry;
      const matchesYear =
        selectedYear === "Tất cả" || String(movie.releaseYear) === selectedYear;
      const matchesSearch =
        !query ||
        `${movie.title} ${movie.category} ${movie.country}`
          .toLocaleLowerCase("vi")
          .includes(query);
      return matchesCategory && matchesCountry && matchesYear && matchesSearch;
    });
    return filtered.sort((a, b) => {
      if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === "title") return a.title.localeCompare(b.title, "vi");
      return Number(b.releaseYear || 0) - Number(a.releaseYear || 0);
    });
  }, [movies, searchTerm, selectedCategory, selectedCountry, selectedYear, sortBy]);
  const favoriteMovies = useMemo(
    () =>
      favorites
        .map((item) =>
          typeof item === "object" && item !== null
            ? item
            : movies.find((movie) => movie._id === String(item)),
        )
        .filter(Boolean),
    [favorites, movies],
  );

  const openMovie = async (movie) => {
    setSelectedMovie(movie);
    const updated = [
      movie,
      ...watchHistory.filter((item) => item._id !== movie._id),
    ].slice(0, 30);
    setWatchHistory(updated);
    writeJsonStorage("movie_history", updated);
    const token = localStorage.getItem("movie_token");
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`${API_URL}/users/history`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: movie._id }),
      });
      if (response.status === 401) {
        logout();
        setIsAuthOpen(true);
        return;
      }
      if (!response.ok) {
        throw new Error(`Watch history request failed with status ${response.status}.`);
      }
      const data = await response.json();
      if (Array.isArray(data.watchHistory)) {
        setWatchHistory(data.watchHistory);
        writeJsonStorage("movie_history", data.watchHistory);
      }
    } catch (error) {
      console.error("Could not sync viewing history.", error);
    }
  };

  const toggleFavorite = (movie) => {
    const exists = favorites.some(
      (item) => String(typeof item === "object" ? item._id : item) === movie._id,
    );
    const updated = exists
      ? favorites.filter(
          (item) => String(typeof item === "object" ? item._id : item) !== movie._id,
        )
      : [movie, ...favorites];
    setFavorites(updated);
    writeJsonStorage("movie_favorites", updated);
    const removedFavoriteIds = readJsonStorage(
      "movie_removed_favorites",
      [],
      (value) => Array.isArray(value) && value.every((id) => typeof id === "string"),
    ).filter((id) => id !== movie._id);
    writeJsonStorage("movie_removed_favorites", removedFavoriteIds);
    const token = localStorage.getItem("movie_token");
    if (currentUser && token) {
      fetch(`${API_URL}/users/favorites`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: movie._id }),
      })
        .then(async (response) => {
          if (response.status === 401) {
            logout();
            setIsAuthOpen(true);
            if (exists) {
              writeJsonStorage("movie_removed_favorites", [
                ...removedFavoriteIds,
                movie._id,
              ]);
            }
            return;
          }
          if (!response.ok) {
            throw new Error(`Favorite request failed with status ${response.status}.`);
          }
          const data = await response.json();
          if (!Array.isArray(data.favorites)) {
            throw new TypeError("Favorite response is missing the updated movie list.");
          }
          setFavorites(data.favorites);
          writeJsonStorage("movie_favorites", data.favorites);
        })
        .catch((error) => {
          console.error("Could not sync favorite with the account.", error);
          if (exists) {
            writeJsonStorage("movie_removed_favorites", [
              ...removedFavoriteIds,
              movie._id,
            ]);
          }
        });
    }
  };

  const logout = () => {
    localStorage.removeItem("movie_token");
    localStorage.removeItem("movie_user");
    setCurrentUser(null);
    setProfileName("");
    setProfileBio("");
    setActiveView("home");
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setActiveView("home");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("movie_token");
    if (!token || !currentUser) {
      setIsAuthOpen(true);
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");
    try {
      const response = await fetch(`${API_URL}/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName.trim(),
          avatar: currentUser.avatar || "",
          bio: profileBio.trim(),
          bannerUrl: currentUser.bannerUrl || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileMessage(data.message || "Không thể cập nhật hồ sơ.");
        return;
      }
      if (!data.user) {
        throw new TypeError("Profile response is missing the updated user.");
      }
      setCurrentUser(data.user);
      setProfileName(data.user.name || "");
      setProfileBio(data.user.bio || "");
      writeJsonStorage("movie_user", data.user);
      setProfileMessage("Đã cập nhật hồ sơ.");
    } catch (error) {
      console.error("Could not update the Movie App profile.", error);
      setProfileMessage("Không thể kết nối máy chủ. Hồ sơ chưa được cập nhật.");
    } finally {
      setSavingProfile(false);
    }
  };

  const bannerMovies = movies.slice(0, 5);
  const currentBanner = bannerMovies[bannerIndex % Math.max(bannerMovies.length, 1)];
  const popularMovies = [...movies]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 10);
  const newestMovies = [...movies]
    .sort(
      (a, b) =>
        Number(b.releaseYear || 0) - Number(a.releaseYear || 0) ||
        Number(b.rating || 0) - Number(a.rating || 0),
    )
    .slice(0, 10);

  useEffect(() => {
    if (bannerMovies.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setBannerIndex((index) => (index + 1) % bannerMovies.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [bannerMovies.length]);

  const isFiltering =
    Boolean(searchTerm.trim()) ||
    selectedCategory !== "Tất cả" ||
    selectedCountry !== "Tất cả" ||
    selectedYear !== "Tất cả";
  const countries = [...new Set(movies.map((movie) => movie.country).filter(Boolean))].sort();
  const years = [...new Set(movies.map((movie) => String(movie.releaseYear)).filter(Boolean))].sort(
    (a, b) => Number(b) - Number(a),
  );
  const selectedViewMovies =
    activeView === "favorites" ? favoriteMovies : watchHistory;

  return (
    <div className="movie-site">
      <Navbar
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        countries={countries}
        years={years}
        selectedCountry={selectedCountry}
        onSelectCountry={(country) => {
          setSelectedCountry(country);
          setActiveView("home");
        }}
        selectedYear={selectedYear}
        onSelectYear={(year) => {
          setSelectedYear(year);
          setActiveView("home");
        }}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        activeView={activeView}
        onSelectView={setActiveView}
        currentUser={currentUser}
        onRequestLogin={() => setIsAuthOpen(true)}
        onLogout={logout}
        onRequestVip={() => setIsVipOpen(true)}
        recentMovies={watchHistory}
        favoriteCount={favoriteMovies.length}
      />

      {currentBanner && (
        <section className="movie-hero" aria-label="Phim nổi bật">
          <img
            key={currentBanner._id}
            className="movie-hero__image"
            src={currentBanner.backdropUrl || currentBanner.posterUrl}
            alt=""
            onError={(event) => {
              if (
                currentBanner.posterUrl &&
                event.currentTarget.src !== currentBanner.posterUrl
              ) {
                event.currentTarget.src = currentBanner.posterUrl;
              } else {
                event.currentTarget.removeAttribute("src");
              }
            }}
          />
          <div className="movie-hero__shade" />
          <div className="movie-hero__content">
            <div className="movie-hero__copy">
              <span className="movie-hero__eyebrow">
                MOVIE APP <span>•</span> PHIM NỔI BẬT
              </span>
              <h1 key={currentBanner._id}>{currentBanner.title}</h1>
              <div className="movie-hero__meta">
                <span className="movie-hero__rating">
                  ★ {Number(currentBanner.rating || 0).toFixed(1)}
                </span>
                <span>{currentBanner.releaseYear || "Mới cập nhật"}</span>
                <span>{currentBanner.category}</span>
              </div>
              <p>{currentBanner.description}</p>
              <div className="movie-hero__buttons">
                <button
                  type="button"
                  className="movie-hero__button"
                  onClick={() => openMovie(currentBanner)}
                >
                  <Play size={17} fill="currentColor" />
                  Xem ngay
                </button>
                  <button
                    type="button"
                    className="movie-hero__button movie-hero__button--secondary"
                    onClick={() => openMovie(currentBanner)}
                  >
                    <Info size={17} />
                    Chi tiết
                  </button>
              </div>
            </div>
            <div className="movie-hero__controls" aria-label="Chọn phim nổi bật">
              {bannerMovies.map((movie, index) => (
                <button
                  type="button"
                  key={movie._id}
                  className={
                    bannerIndex === index
                      ? "movie-hero__dot is-active"
                      : "movie-hero__dot"
                  }
                  aria-label={`Xem phim nổi bật: ${movie.title}`}
                  aria-current={bannerIndex === index ? "true" : undefined}
                  onClick={() => setBannerIndex(index)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <main id="movie-rows" className="movie-home__rows">
        {activeView === "profile" ? (
          <section className="movie-profile">
            <span className="movie-detail-modal__eyebrow">TÀI KHOẢN</span>
            <h2>{currentUser?.name || "Hồ sơ Movie App"}</h2>
            <p>{currentUser?.email || "Bạn chưa đăng nhập."}</p>
            {currentUser ? (
              <form className="movie-profile-form" onSubmit={saveProfile}>
                <label>
                  Tên hiển thị
                  <input
                    required
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                </label>
                <label>
                  Giới thiệu
                  <textarea
                    rows="3"
                    value={profileBio}
                    onChange={(event) => setProfileBio(event.target.value)}
                  />
                </label>
                {profileMessage && <p role="status">{profileMessage}</p>}
                <button type="submit" className="movie-hero__button" disabled={savingProfile}>
                  {savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
                </button>
              </form>
            ) : (
              <button type="button" className="movie-hero__button" onClick={() => setIsAuthOpen(true)}>
                Đăng nhập
              </button>
            )}
          </section>
        ) : activeView !== "home" ? (
          selectedViewMovies.length > 0 ? (
            <MovieRow
              title={activeView === "favorites" ? "DANH SÁCH CỦA TÔI" : "ĐANG XEM"}
              movies={selectedViewMovies}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <p className="movie-empty">
              {activeView === "favorites"
                ? "Danh sách của bạn chưa có phim nào."
                : "Bạn chưa mở chi tiết phim nào."}
            </p>
          )
        ) : isFiltering ? (
          visibleMovies.length > 0 ? (
            <MovieRow
              id="genres"
              title={
                searchTerm.trim()
                  ? `KẾT QUẢ TÌM KIẾM: “${searchTerm.trim()}”`
                  : `PHIM ${selectedCategory.toLocaleUpperCase("vi")}`
              }
              movies={visibleMovies}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <p className="movie-empty">Không tìm thấy phim phù hợp.</p>
          )
        ) : (
          <>
            <MovieRow
              id="popular"
              title="THỊNH HÀNH"
              movies={popularMovies}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
            <MovieRow
              id="newest"
              title="MỚI NHẤT"
              movies={newestMovies}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
            <MovieRow
              title="TOP 10 MOVIE APP"
              movies={popularMovies}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
            {categories
              .filter((category) => category !== "Tất cả")
              .map((category, index) => (
                <MovieRow
                  key={category}
                  id={index === 0 ? "genres" : index === 2 ? "kids" : undefined}
                  title={`PHIM ${category.toLocaleUpperCase("vi")}`}
                  movies={movies.filter((movie) => movie.category === category).slice(0, 10)}
                  favorites={favoriteMovies.map((movie) => movie._id)}
                  onSelectMovie={openMovie}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            <MovieRow
              title="ĐANG XEM"
              movies={watchHistory}
              favorites={favoriteMovies.map((movie) => movie._id)}
              onSelectMovie={openMovie}
              onToggleFavorite={toggleFavorite}
            />
          </>
        )}
      </main>

      {selectedMovie && (
        <MovieDetailModal
          key={selectedMovie._id}
          movie={selectedMovie}
          currentUser={currentUser}
          isFavorite={favoriteMovies.some((item) => item._id === selectedMovie._id)}
          onClose={() => setSelectedMovie(null)}
          onToggleFavorite={toggleFavorite}
          onRequestLogin={() => setIsAuthOpen(true)}
        />
      )}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setProfileName(user.name || "");
            setProfileBio(user.bio || "");
          }}
        />
      )}
      {isVipOpen && (
        <VipModal
          currentUser={currentUser}
          onClose={() => setIsVipOpen(false)}
          onRequestLogin={() => setIsAuthOpen(true)}
        />
      )}

      <footer className="movie-footer">
        <a href="#top" className="movie-footer__brand">
          MOVIE<span>APP</span>
        </a>
        <p>Không gian điện ảnh dành riêng cho bạn.</p>
        <span>© {new Date().getFullYear()} Movie App</span>
      </footer>
    </div>
  );
}

export default App;
