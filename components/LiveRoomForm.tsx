import { account,check } from "@/lib/supabase";

export async function LiveRoomForm({action}:{action:(form:FormData)=>Promise<void>}) {
  const {db,user}=await account(true);
  const {data,error}=await db.from("classrooms").select("id,name").eq("owner_id",user.id).is("archived_at",null).order("name");
  check(error,"live_class_choices");
  return <details className="panel"><summary>Tạo phòng trực tiếp</summary><form action={action} className="stack">
    <label>Nhịp chơi<select name="pace"><option value="teacher">Giáo viên chuyển câu</option><option value="student">Học sinh tự chuyển câu</option></select></label>
    <label>Người tham gia<select name="classroom"><option value="">Ai có mã phòng</option>
      {data?.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    <label>Hình thức<select name="competition"><option value="individual">Cá nhân</option><option value="teams">Chia hai đội</option></select></label>
    <label className="check"><input type="checkbox" name="leaderboard"/> Hiện bảng vinh danh cuối phòng</label>
    <button className="button primary">Mở phòng</button>
  </form></details>;
}
