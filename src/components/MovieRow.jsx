import { useRef } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

export default function MovieRow({
  id,
  title,
  movies,
  favorites = [],
  onSelectMovie,
  onToggleFavorite,
}) {
  const railRef = useRef(null);

  if (movies.length === 0) return null;

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  return (
    <section id={id} className="movie-section" aria-label={title}>
      <div className="movie-section__heading">
        <h2>{title}</h2>
        <div className="movie-section__actions">
          <button
            type="button"
            aria-label={`Cuộn ${title} sang trái`}
            onClick={() => scrollRail(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label={`Cuộn ${title} sang phải`}
            onClick={() => scrollRail(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="movie-rail" ref={railRef}>
        {movies.map((movie) => (
          <article className="movie-tile" key={movie._id}>
            <button
              type="button"
              className="movie-tile__open"
              onClick={() => onSelectMovie?.(movie)}
              aria-label={`Xem chi tiết ${movie.title}`}
            >
              <span className="movie-tile__image">
                <img
                  src={movie.backdropUrl || movie.posterUrl}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    if (
                      movie.posterUrl &&
                      event.currentTarget.src !== movie.posterUrl
                    ) {
                      event.currentTarget.src = movie.posterUrl;
                    } else {
                      event.currentTarget.removeAttribute("src");
                    }
                  }}
                />
                <span className="movie-tile__rating">
                  ★ {Number(movie.rating || 0).toFixed(1)}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={
                favorites.includes(movie._id)
                  ? "movie-tile__favorite is-active"
                  : "movie-tile__favorite"
              }
              onClick={() => onToggleFavorite?.(movie)}
              aria-label={
                favorites.includes(movie._id)
                  ? `Bỏ ${movie.title} khỏi danh sách của tôi`
                  : `Thêm ${movie.title} vào danh sách của tôi`
              }
              aria-pressed={favorites.includes(movie._id)}
            >
              <Heart
                size={17}
                fill={favorites.includes(movie._id) ? "currentColor" : "none"}
              />
            </button>
            <div className="movie-tile__info">
              <h3>{movie.title}</h3>
              <p>{movie.category || "Phim mới cập nhật"}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
