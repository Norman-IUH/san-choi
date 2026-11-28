import Link from "next/link";
import {goToLiveRoom} from "./actions";

export default async function LiveEntry({searchParams}:{searchParams:Promise<{invalid?:string}>}) {
  const query=await searchParams;
  return <div className="narrow stack"><h1>Lớp trực tiếp</h1>
    <form className="panel stack" action={goToLiveRoom}>
      <label>Mã phòng<input name="code" maxLength={12} autoCapitalize="characters" autoComplete="off" required/></label>
      {query.invalid && <p role="alert">Nhập đủ 12 ký tự trong mã phòng.</p>}
      <button className="button primary">Mở phòng học</button>
    </form>
    <Link href="/live/host">Quản lý phòng của giáo viên</Link>
  </div>;
}
