import { describe, expect, it } from "vitest";
import fallbackMovies, { normalizeMovie } from "./fallbackMovies";

describe("movie catalogue normalization", () => {
  it("normalizes alternate movie fields while preserving zero ratings", () => {
    expect(
      normalizeMovie(
        {
          id: "movie-42",
          name: "Test Movie",
          poster: "/poster.jpg",
          rating: 0,
        },
        3,
      ),
    ).toMatchObject({
      _id: "movie-42",
      title: "Test Movie",
      category: "Hành động",
      country: "Mỹ",
      releaseYear: 2024,
      rating: 0,
      posterUrl: "/poster.jpg",
      poster: "/poster.jpg",
    });
  });

  it("provides a usable, uniquely identified fallback catalogue", () => {
    expect(fallbackMovies.length).toBeGreaterThan(0);
    expect(new Set(fallbackMovies.map((movie) => movie._id)).size).toBe(
      fallbackMovies.length,
    );
    expect(
      fallbackMovies.every((movie) => movie.title && movie.posterUrl),
    ).toBe(true);
  });
});
