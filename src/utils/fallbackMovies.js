const defaultPoster = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80";

export function normalizeMovie(movie, index = 0) {
  const normalized = { ...movie };

  normalized._id = movie?._id || movie?.id || `fallback-${index}`;
  normalized.title = movie?.title || movie?.name || "Phim mới";
  normalized.description =
    movie?.description || "Chưa có mô tả cho bộ phim này.";
  normalized.category = movie?.category || "Hành động";
  normalized.country = movie?.country || "Mỹ";
  normalized.releaseYear = movie?.releaseYear || 2024;
  normalized.rating = movie?.rating ?? 8.5;
  normalized.isVipOnly = Boolean(movie?.isVipOnly);
  normalized.posterUrl =
    movie?.posterUrl || movie?.poster || movie?.thumbnail || defaultPoster;
  normalized.poster = normalized.posterUrl;
  normalized.videoUrl = movie?.videoUrl || "";

  return normalized;
}

export const fallbackMovies = [
  {
    _id: "fallback-1",
    title: "Colisión",
    description: "Một câu chuyện hành động đầy kịch tính về một cuộc đuổi bắt không khoan nhượng.",
    category: "Hành động",
    country: "Mỹ",
    releaseYear: 2025,
    rating: 8.9,
    isVipOnly: false,
    posterUrl:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    _id: "fallback-2",
    title: "Cú Rơi Từ Thần 2: Điểm Chết",
    description: "Khi một cuộc rơi xuống vách núi đánh thức bí mật chết chóc trong lòng đất.",
    category: "Hành động",
    country: "Nhật Bản",
    releaseYear: 2024,
    rating: 8.7,
    isVipOnly: true,
    posterUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    _id: "fallback-3",
    title: "Khó Lý Thế",
    description: "Một bộ phim tâm lý ly kỳ với những quyết định khó tin và cuộc sống đổi thay.",
    category: "Kinh dị",
    country: "Hàn Quốc",
    releaseYear: 2025,
    rating: 8.3,
    isVipOnly: false,
    posterUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
  },
  {
    _id: "fallback-4",
    title: "Biển Đêm",
    description: "Một chuyến đi tìm lại ký ức và những người đã mất ở bờ biển xa.",
    category: "Tình cảm",
    country: "Việt Nam",
    releaseYear: 2023,
    rating: 8.1,
    isVipOnly: false,
    posterUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    _id: "fallback-5",
    title: "Vệ Tinh Tím",
    description: "Một phi hành gia trẻ phải cứu Trái Đất trước khi lửa mặt trời ăn nuốt mọi thứ.",
    category: "Khoa học viễn tưởng",
    country: "Mỹ",
    releaseYear: 2026,
    rating: 8.8,
    isVipOnly: true,
    posterUrl:
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
  },
];

export default fallbackMovies.map((movie, index) => normalizeMovie(movie, index));
