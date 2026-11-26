import { account } from "@/lib/supabase";
import { signOut, updatePassword, updateProfile } from "@/app/auth/actions";

export default async function Profile({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const [{ user, profile }, { message }] = await Promise.all([account(), searchParams]);
  return <div className="narrow"><section className="panel stack"><h1>Tài khoản</h1><p>{user.email}</p>
    {message && <p className="notice" role="status">{message === "saved" ? "Đã lưu." : "Chưa lưu được. Hãy thử lại."}</p>}
    <form className="stack" action={updateProfile}><label>Tên hiển thị<input name="name" defaultValue={profile.display_name} required maxLength={100}/></label><button className="button primary">Lưu hồ sơ</button></form>
    <form className="stack" action={updatePassword}><label>Mật khẩu mới<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label><button className="button">Đổi mật khẩu</button></form>
    <form action={signOut}><button className="button">Đăng xuất</button></form>
  </section></div>;
}
