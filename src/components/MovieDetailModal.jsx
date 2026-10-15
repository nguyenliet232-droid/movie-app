import { X } from "lucide-react";

function MovieDetailModal({ movie, onClose }) {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full z-10 transition"
        >
          <x className="w-5 h-5" />
        </button>

        {/* Khung Trình chiếu Video */}
        <div className="aspect-video w-full bg-black">
          {movie.videoUrl?.includes("youtube.com") ||
          movie.videoUrl?.includes("youtu.be") ? (
            <iframe
              src={movie.videoUrl.replace("watch?v=", "embed/")}
              title={movie.title}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={movie.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            ></video>
          )}
        </div>

        {/* Thông tin Phim */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-white">{movie.title}</h2>
          <p className="text-slate-400 text-sm">
            {movie.description || "Chưa có mô tả chi tiết cho bộ phim này."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MovieDetailModal;
