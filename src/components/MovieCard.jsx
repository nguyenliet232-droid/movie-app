import { Play, Heart, Crown } from "lucide-react";

function MovieCard({ movie, onClick, isFavorite, onToggleFavorite }) {
  return (
    <div
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-slate-700 transition hover:-translate-y-1 shadow-md relative"
    >
      <div className="relative aspect-2/3 overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/150x225?text=No+Image";
          }}
        />

        {/* 🌟 HIỂN THỊ HUY HIỆU VIP NẾU PHIM LÀ PHIM VIP */}
        {movie.isVipOnly && (
          <span className="absolute top-3 left-3 bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-wider z-10 border border-yellow-300/40">
            <Crown className="w-3 h-3 fill-current" /> VIP
          </span>
        )}

        {/* Nút Thả tim Yêu thích ở góc trên bên phải */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Ngăn không cho mở modal xem phim khi bấm vào nút tim
            onToggleFavorite(movie);
          }}
          className="absolute top-3 right-3 p-2 bg-slate-900/60 backdrop-blur-md rounded-full text-white hover:bg-slate-900 transition z-10 cursor-pointer"
          title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <Heart
            className={`w-5 h-5 transition ${
              isFavorite
                ? "text-red-500 fill-red-500 scale-110"
                : "text-white hover:text-red-400"
            }`}
          />
        </button>

        {/* Overlay nút Play khi hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <div className="p-3 bg-red-600 rounded-full text-white shadow-lg">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1 text-slate-200 group-hover:text-red-400 transition">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-400 line-clamp-1">
            {movie.category || movie.description || "Phim mới cập nhật"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
