import { useEffect, useState } from "react";
import { Heart, Play, Send, Star, X } from "lucide-react";
import { TMDB_API_KEY } from "../utils/api";
import { readJsonStorage, writeJsonStorage } from "../utils/storage";

function getYoutubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      return match?.[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function MovieDetailModal({
  movie,
  currentUser,
  isFavorite,
  onClose,
  onToggleFavorite,
  onRequestLogin,
}) {
  const [reviews, setReviews] = useState(() =>
    readJsonStorage(
      `movie_comments_${movie._id}`,
      [],
      (value) => Array.isArray(value),
    ),
  );
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [playbackError, setPlaybackError] = useState("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const playMovie = async () => {
    setPlaybackError("");
    const directUrl = movie.videoUrl || movie.trailerUrl;
    if (directUrl) {
      setPlaybackUrl(directUrl);
      return;
    }
    if (!TMDB_API_KEY || !/^\d+$/.test(String(movie._id))) {
      setPlaybackError("Chưa có liên kết phát phim cho nội dung này.");
      return;
    }

    setLoadingPlayback(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie._id}/videos?api_key=${TMDB_API_KEY}&language=vi-VN`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        throw new Error(`Trailer request failed with status ${response.status}.`);
      }

      const data = await response.json();
      if (!Array.isArray(data.results)) {
        throw new TypeError("Trailer service returned an invalid response.");
      }

      const trailer =
        data.results.find(
          (item) => item.site === "YouTube" && item.type === "Trailer",
        ) || data.results.find((item) => item.site === "YouTube");
      if (!trailer?.key) {
        setPlaybackError("Phim này chưa có trailer để phát.");
        return;
      }
      setPlaybackUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
    } catch (error) {
      console.error("Could not load a movie trailer.", error);
      setPlaybackError("Không thể tải trailer. Vui lòng thử lại.");
    } finally {
      setLoadingPlayback(false);
    }
  };

  const addReview = (event) => {
    event.preventDefault();
    if (!currentUser) {
      onRequestLogin();
      return;
    }
    const text = comment.trim();
    if (!text) return;

    const nextReviews = [
      {
        id: `${Date.now()}`,
        userName: currentUser.name || currentUser.email || "Thành viên",
        rating,
        text,
        date: new Date().toLocaleDateString("vi-VN"),
      },
      ...reviews,
    ];
    setReviews(nextReviews);
    writeJsonStorage(`movie_comments_${movie._id}`, nextReviews);
    setComment("");
    setRating(5);
  };

  const youtubeId = playbackUrl ? getYoutubeId(playbackUrl) : null;

  return (
    <div
      className="movie-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="movie-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
      >
        <button
          type="button"
          className="movie-detail-modal__close"
          onClick={onClose}
          aria-label="Đóng chi tiết phim"
        >
          <X size={20} />
        </button>

        <div className="movie-detail-modal__player">
          {playbackUrl ? (
            youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`}
                title={`Trailer ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video src={playbackUrl} controls autoPlay playsInline />
            )
          ) : (
            <>
              <img
                src={movie.backdropUrl || movie.posterUrl}
                alt=""
                onError={(event) => event.currentTarget.removeAttribute("src")}
              />
              <button
                type="button"
                className="movie-detail-modal__play"
                onClick={playMovie}
                disabled={loadingPlayback}
              >
                <Play size={19} fill="currentColor" />
                {loadingPlayback ? "Đang tải..." : "Xem trailer"}
              </button>
              {playbackError && (
                <p className="movie-detail-modal__play-error" role="status">
                  {playbackError}
                </p>
              )}
            </>
          )}
        </div>

        <div className="movie-detail-modal__content">
          <div className="movie-detail-modal__heading">
            <div>
              <span className="movie-detail-modal__eyebrow">MOVIE APP</span>
              <h2 id="movie-detail-title">{movie.title}</h2>
            </div>
            <button
              type="button"
              className={
                isFavorite
                  ? "movie-detail-modal__favorite is-active"
                  : "movie-detail-modal__favorite"
              }
              onClick={() => onToggleFavorite(movie)}
              aria-pressed={isFavorite}
            >
              <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "Đã lưu" : "Danh sách của tôi"}
            </button>
          </div>

          <div className="movie-detail-modal__meta">
            <span className="movie-detail-modal__rating">
              <Star size={15} fill="currentColor" />{" "}
              {Number(movie.rating || 0).toFixed(1)}
            </span>
            <span>{movie.releaseYear}</span>
            <span>{movie.country}</span>
            <span>{movie.category}</span>
          </div>
          <p className="movie-detail-modal__description">{movie.description}</p>

          <section className="movie-reviews" aria-label="Đánh giá và bình luận">
            <h3>Đánh giá và bình luận</h3>
            <form className="movie-review-form" onSubmit={addReview}>
              <label>
                Đánh giá
                <select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score} sao
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                rows="3"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  currentUser
                    ? "Chia sẻ cảm nghĩ của bạn..."
                    : "Đăng nhập để viết bình luận."
                }
                aria-label="Viết bình luận"
              />
              <button type="submit" className="movie-review-form__submit">
                <Send size={15} />
                Gửi bình luận
              </button>
            </form>

            {reviews.length ? (
              <ul className="movie-review-list">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <div className="movie-review-list__heading">
                      <strong>{review.userName}</strong>
                      <span>
                        ★ {review.rating} · {review.date}
                      </span>
                    </div>
                    <p>{review.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="movie-review-list__empty">
                Chưa có bình luận nào. Hãy chia sẻ cảm nhận đầu tiên.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
