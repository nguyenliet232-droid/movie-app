function SkeletonCard({ darkMode }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`aspect-[2/3] animate-pulse ${
          darkMode ? "bg-slate-800" : "bg-gray-200"
        }`}
      />
      <div className="space-y-2 p-3">
        <div
          className={`h-4 w-3/4 animate-pulse rounded ${
            darkMode ? "bg-slate-800" : "bg-gray-200"
          }`}
        />
        <div
          className={`h-3 w-full animate-pulse rounded ${
            darkMode ? "bg-slate-800" : "bg-gray-200"
          }`}
        />
      </div>
    </div>
  );
}

export default SkeletonCard;
