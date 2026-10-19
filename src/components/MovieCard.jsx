import { Play, Heart } from "lucide-react";

function MovieCard({ movie, onClick, isFavorite, onToggleFavorite }) {
  return (
    <div
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-slate-700 transition hover:-translate-y-1 shadow-md relative"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

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
        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
          {movie.description || "Phim mới cập nhật"}
        </p>
      </div>
    </div>
  );
}

export default MovieCard;
