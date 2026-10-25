const DEVELOPMENT_API_URL = "http://localhost:5001/api";
const PRODUCTION_API_URL =
  "https://user-management-backend-7clg.onrender.com/api";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEVELOPMENT_API_URL : PRODUCTION_API_URL);
