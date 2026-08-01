import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth";

// Client ID bạn tự tạo trên Google Cloud Console, đặt trong file .env:
//   VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * FE-04 — Nút "Sign in with Google" (chỉ dành cho Spectator).
 * Luồng: Google trả credential (ID token JWT) → gửi lên BE /api/auth/google
 *        → BE verify + tạo/đăng nhập Spectator → trả accessToken + user.
 *
 * @param {(msg:string)=>void} onError  hiển thị lỗi ở trang cha
 * @param {boolean} rememberMe          giữ đăng nhập (lưu localStorage vs session)
 */
export default function GoogleSignInButton({ onError, rememberMe = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Chưa cấu hình Client ID → không render nút (tránh vỡ giao diện khi demo máy khác)
  if (!CLIENT_ID) return null;

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      onError?.("Could not get Google credential. Please try again.");
      return;
    }
    try {
      const result = await authService.loginWithGoogle(idToken);
      const { accessToken, user, refreshToken } = result.data;
      login(user, accessToken, rememberMe, refreshToken);
      navigate("/dashboard");
    } catch (err) {
      onError?.(err.message || "Google login failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.("Google login was cancelled or failed.")}
          theme="filled_black"
          shape="pill"
          size="large"
          width="320"
          text="signin_with"
          locale="en"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
