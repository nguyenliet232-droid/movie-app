import { useState } from "react";
import { X } from "lucide-react";
import { API_URL } from "../utils/api";

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const endpoint =
        mode === "login"
          ? "/auth/login"
          : mode === "register"
            ? "/auth/send-register-otp"
            : mode === "verify"
              ? "/auth/verify-register-otp"
              : mode === "forgot"
                ? "/auth/forgot-password"
                : "/auth/reset-password";
      const body =
        mode === "login"
          ? { email, password }
          : mode === "register"
            ? { email }
            : mode === "verify"
              ? { email, otp, name, password }
              : mode === "forgot"
                ? { email }
                : { email, otp, newPassword: password };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Không thể hoàn tất yêu cầu. Vui lòng thử lại.");
        return;
      }
      if (mode === "register") {
        setMode("verify");
        setMessage(data.message || "Mã xác nhận đã được gửi đến email của bạn.");
        return;
      }
      if (mode === "forgot") {
        setMode("reset");
        setMessage(data.message || "Mã xác nhận đã được gửi đến email của bạn.");
        return;
      }
      if (mode === "reset") {
        setMode("login");
        setMessage(data.message || "Đã đổi mật khẩu. Hãy đăng nhập lại.");
        return;
      }
      if (!data.token || !data.user) {
        throw new TypeError("Authentication response is missing user credentials.");
      }
      localStorage.setItem("movie_token", data.token);
      localStorage.setItem("movie_user", JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (error) {
      console.error("Authentication request failed.", error);
      setMessage("Không thể kết nối máy chủ tài khoản. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="movie-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="movie-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-auth-title"
      >
        <button type="button" className="movie-detail-modal__close" onClick={onClose} aria-label="Đóng đăng nhập">
          <X size={20} />
        </button>
        <span className="movie-detail-modal__eyebrow">MOVIE APP</span>
        <h2 id="movie-auth-title">
          {mode === "login"
            ? "Đăng nhập"
            : mode === "register"
              ? "Tạo tài khoản"
              : mode === "forgot"
                ? "Quên mật khẩu"
                : mode === "reset"
                  ? "Đặt lại mật khẩu"
                  : "Xác nhận email"}
        </h2>
        <p>Đăng nhập để quản lý tài khoản và chia sẻ đánh giá. Danh sách phim được lưu trên thiết bị này.</p>
        <form className="movie-auth-form" onSubmit={submit}>
          {(mode === "verify") && (
            <label>
              Họ và tên
              <input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={mode === "verify" || mode === "reset"}
            />
          </label>
          {(mode === "login" || mode === "verify" || mode === "reset") && (
            <label>
              {mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                required
                value={mode === "reset" ? newPassword : password}
                onChange={(event) =>
                  mode === "reset"
                    ? setNewPassword(event.target.value)
                    : setPassword(event.target.value)
                }
              />
            </label>
          )}
          {(mode === "verify" || mode === "reset") && (
            <label>
              Mã xác nhận
              <input inputMode="numeric" required value={otp} onChange={(event) => setOtp(event.target.value)} />
            </label>
          )}
          {message && <p className="movie-auth-form__message" role="status">{message}</p>}
          <button type="submit" disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : mode === "register" || mode === "forgot"
                  ? "Gửi mã xác nhận"
                  : mode === "reset"
                    ? "Đặt lại mật khẩu"
                    : "Tạo tài khoản"}
          </button>
        </form>
        {mode === "login" && (
          <button
            type="button"
            className="movie-auth-modal__switch"
            onClick={() => {
              setMode("forgot");
              setMessage("");
            }}
          >
            Quên mật khẩu?
          </button>
        )}
        {mode === "login" || mode === "register" ? (
          <button
            type="button"
            className="movie-auth-modal__switch"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>
        ) : mode === "reset" ? (
          <button
            type="button"
            className="movie-auth-modal__switch"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Quay lại đăng nhập
          </button>
        ) : null}
      </section>
    </div>
  );
}
