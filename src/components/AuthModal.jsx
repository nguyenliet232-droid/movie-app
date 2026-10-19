import { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL = "https://user-management-backend-7clg.onrender.com/api";

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  // Chế độ hiển thị: 'login' | 'register-1' | 'register-2' | 'forgot-1' | 'forgot-2'
  const [view, setView] = useState("login");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 🌟 State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!isOpen) return null;

  // Reset khi đóng modal
  const handleClose = () => {
    setView("login");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setOtp("");
    setNewPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setMessage({ type: "", text: "" });
    onClose();
  };

  // 1. Xử lý Đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("movie_token", data.token);
        localStorage.setItem("movie_user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
        handleClose();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Đăng nhập thất bại!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý gửi OTP Đăng ký
  const handleSendRegisterOTP = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại!",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/auth/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Mã OTP đã được gửi tới Email của bạn!",
        });
        setView("register-2");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Không thể gửi OTP!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý Xác thực OTP & Hoàn tất Đăng ký
  const handleVerifyRegisterOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/auth/verify-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("🎉 Đăng ký tài khoản thành công! Hãy đăng nhập.");
        setView("login");
        setOtp("");
        setConfirmPassword("");
        setMessage({
          type: "success",
          text: "Đăng ký thành công! Hãy đăng nhập ngay.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Mã OTP không đúng hoặc đã hết hạn!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setLoading(false);
    }
  };

  // 4. Xử lý Quên mật khẩu - Gửi OTP khôi phục
  const handleSendForgotOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Mã OTP đặt lại mật khẩu đã được gửi tới Email của bạn!",
        });
        setView("forgot-2");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Không thể gửi yêu cầu quên mật khẩu!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setLoading(false);
    }
  };

  // 5. Xử lý Quên mật khẩu - Xác thực OTP & Đổi mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("🎉 Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        setView("login");
        setOtp("");
        setNewPassword("");
        setMessage({
          type: "success",
          text: "Đổi mật khẩu thành công! Hãy đăng nhập.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Mã OTP không hợp lệ hoặc đã hết hạn!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-white">
        {/* Nút đóng */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề */}
        <h2 className="text-2xl font-bold mb-2 text-center text-red-500">
          {view === "login" && "Đăng Nhập"}
          {view.startsWith("register") && "Đăng Ký Tài Khoản"}
          {view.startsWith("forgot") && "Khôi Phục Mật Khẩu"}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-6">
          {view === "login" && "Chào mừng bạn quay trở lại CINEMA-STREAM"}
          {view.startsWith("register") &&
            "Tạo tài khoản để trải nghiệm dịch vụ xem phim chất lượng cao"}
          {view.startsWith("forgot") &&
            "Nhập email đã đăng ký để nhận mã OTP lấy lại mật khẩu"}
        </p>

        {/* Thông báo */}
        {message.text && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-4 ${
              message.type === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 1. FORM ĐĂNG NHẬP */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot-1");
                    setMessage({ type: "", text: "" });
                  }}
                  className="text-xs text-red-400 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "⏳ Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>
        )}

        {/* 2. FORM ĐĂNG KÝ - BƯỚC 1 */}
        {view === "register-1" && (
          <form onSubmit={handleSendRegisterOTP} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Họ và Tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Email nhận OTP
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading ? "⏳ Đang gửi OTP..." : "Nhận Mã OTP Qua Email"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. FORM ĐĂNG KÝ - BƯỚC 2: NHẬP OTP */}
        {view === "register-2" && (
          <form onSubmit={handleVerifyRegisterOTP} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Nhập mã OTP đã gửi về{" "}
                <span className="text-white font-bold">{email}</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 chữ số OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm tracking-widest font-mono text-center text-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "⏳ Đang xác thực..." : "Xác Nhận & Hoàn Tất Đăng Ký"}
            </button>

            <button
              type="button"
              onClick={() => setView("register-1")}
              className="w-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              ← Quay lại thay đổi thông tin
            </button>
          </form>
        )}

        {/* 4. FORM QUÊN MẬT KHẨU - BƯỚC 1 */}
        {view === "forgot-1" && (
          <form onSubmit={handleSendForgotOTP} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Email tài khoản của bạn
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? "⏳ Đang gửi yêu cầu..."
                  : "Gửi Mã OTP Lấy Lại Mật Khẩu"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setView("login");
                setMessage({ type: "", text: "" });
              }}
              className="w-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              ← Quay lại trang đăng nhập
            </button>
          </form>
        )}

        {/* 5. FORM QUÊN MẬT KHẨU - BƯỚC 2 */}
        {view === "forgot-2" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Nhập mã OTP đã gửi tới{" "}
                <span className="text-white font-bold">{email}</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 chữ số OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm tracking-widest font-mono text-center text-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "⏳ Đang cập nhật..." : "Xác Nhận Đổi Mật Khẩu"}
            </button>

            <button
              type="button"
              onClick={() => setView("forgot-1")}
              className="w-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              ← Gửi lại mã OTP
            </button>
          </form>
        )}

        {/* CHÂN MODAL */}
        {view !== "forgot-1" && view !== "forgot-2" && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            {view.startsWith("register") ? (
              <p>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setMessage({ type: "", text: "" });
                  }}
                  className="text-red-400 font-semibold hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </p>
            ) : (
              <p>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("register-1");
                    setMessage({ type: "", text: "" });
                  }}
                  className="text-red-400 font-semibold hover:underline cursor-pointer"
                >
                  Tạo tài khoản mới
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
