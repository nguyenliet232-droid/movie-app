import { useState } from "react";
import { Crown, X } from "lucide-react";
import { API_URL } from "../utils/api";

const packages = [
  { id: "1_month", label: "1 tháng", detail: " Linh hoạt theo tháng " },
  { id: "6_months", label: " 6 tháng ", detail: " Gói tiết kiệm " },
  { id: "12_months", label: "12 tháng", detail: " Giải trí dài lâu" },
];

export default function VipModal({ currentUser, onClose, onRequestLogin }) {
  const [selectedPackage, setSelectedPackage] = useState("1_month");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestVip = async () => {
    if (!currentUser) {
      onClose();
      onRequestLogin();
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("movie_token");
      if (!token) {
        setMessage("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await fetch(`${API_URL}/users/request-vip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageType: selectedPackage }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(
          data.message || "Không thể gửi yêu cầu VIP. Vui lòng thử lại.",
        );
        return;
      }
      setMessage(
        data.message || "Đã gửi yêu cầu VIP. Hãy kiểm tra thông tin tài khoản.",
      );
    } catch (error) {
      console.error("VIP request failed.", error);
      setMessage("Không thể kết nối máy chủ. Yêu cầu VIP chưa được gửi.");
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
        className="movie-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-title"
      >
        <button
          type="button"
          className="movie-detail-modal__close"
          onClick={onClose}
          aria-label="Đóng gói VIP"
        >
          <X size={20} />
        </button>
        <span className="movie-detail-modal__eyebrow">MOVIE APP</span>
        <h2 id="vip-title">
          <Crown size={22} /> Đặc quyền Movie App
        </h2>
        <p>
          Chọn gói để gửi yêu cầu nâng cấp. Phí và trạng thái sẽ do hệ thống tài
          khoản xác nhận.
        </p>
        <div className="movie-vip-packages">
          {packages.map((item) => (
            <button
              type="button"
              key={item.id}
              className={selectedPackage === item.id ? "is-selected" : ""}
              onClick={() => setSelectedPackage(item.id)}
              aria-pressed={selectedPackage === item.id}
            >
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </button>
          ))}
        </div>
        {message && (
          <p className="movie-auth-form__message" role="status">
            {message}
          </p>
        )}
        <button
          type="button"
          className="movie-vip-submit"
          onClick={requestVip}
          disabled={loading}
        >
          {loading
            ? "Đang gửi..."
            : currentUser
              ? "Gửi yêu cầu VIP"
              : "Đăng nhập để tiếp tục"}
        </button>
      </section>
    </div>
  );
}
