import Link from "next/link";
import { authenticate } from "@/app/auth/actions";
import { configured, singleTeacher } from "@/lib/supabase";
import { redirect } from "next/navigation";

const messages: Record<string, string> = {
  failed: "Chưa xác thực được. Kiểm tra thông tin hoặc thử lại.",
  credentials: "Email hoặc mật khẩu chưa đúng. Nếu chưa có tài khoản, chọn Tạo tài khoản.",
  "invalid-email": "Địa chỉ email chưa hợp lệ. Hãy dùng địa chỉ email đang hoạt động.",
  unavailable: "Máy chủ xác thực đang gián đoạn. Hãy thử lại sau.",
  "email-unavailable": "Máy chủ chưa thể gửi email xác minh cho địa chỉ này. Hãy liên hệ quản trị viên.",
  "signup-disabled": "Tính năng tự đăng ký đang đóng. Hãy liên hệ quản trị viên để được mời.",
  "teacher-only": "Hãy đăng nhập bằng tài khoản giáo viên đã được thiết lập cho Sân Chơi.",
  "weak-password": "Mật khẩu chưa đạt yêu cầu bảo mật. Hãy chọn mật khẩu mạnh hơn.",
  "rate-limited": "Có quá nhiều yêu cầu xác thực. Hãy thử lại sau.",
  invalid: "Kiểm tra email và mật khẩu.",
  verify: "Hãy mở email xác minh để kích hoạt tài khoản.",
  reset: "Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.",
};
type Props = { searchParams: Promise<{ mode?: string; message?: string }> };
function loginTitle(mode?: string) {
  return mode === "register" ? "Tạo tài khoản" : mode === "reset" ? "Đặt lại mật khẩu" : "Đăng nhập";
}

export async function generateMetadata({ searchParams }: Props) {
  return { title: loginTitle((await searchParams).mode) };
}

export default async function Login({ searchParams }: Props) {
  const { mode, message } = await searchParams;
  if (singleTeacher && mode === "register") redirect("/login");
  const register = mode === "register";
  const reset = mode === "reset";
  return <div className="narrow"><section className="panel auth-panel">
    <h1>{loginTitle(mode)}</h1>
    {!configured && <p className="notice" role="status">Tính năng tài khoản cần kết nối Supabase. Bạn vẫn có thể <Link href="/#mau">chơi thử các mẫu</Link>.</p>}
    {message && messages[message] && <p className="notice" role="status">{messages[message]}</p>}
    <form action={authenticate} className="stack">
      <input type="hidden" name="mode" value={register ? "register" : reset ? "reset" : "login"}/>
      <label>Email<input type="email" name="email" autoComplete="email" maxLength={254} required/></label>
      {!reset && <label>Mật khẩu<input type="password" name="password" autoComplete={register ? "new-password" : "current-password"} minLength={8} maxLength={72} required/></label>}
      <button className="button primary" disabled={!configured}>{reset ? "Gửi email" : register ? "Đăng ký" : "Đăng nhập"}</button>
    </form>
    {!singleTeacher && !reset && process.env.GOOGLE_OAUTH_ENABLED === "true" && <form action={authenticate}><button className="button" name="mode" value="google" disabled={!configured}>Tiếp tục với Google</button></form>}
    <div className="inline-actions">{register || reset ? <Link href="/login">Đăng nhập</Link> : <>{!singleTeacher && <Link href="/login?mode=register">Tạo tài khoản</Link>}<Link href="/login?mode=reset">Quên mật khẩu</Link></>}</div>
  </section></div>;
}
