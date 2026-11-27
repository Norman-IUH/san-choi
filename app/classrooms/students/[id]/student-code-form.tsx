"use client";

import { useActionState } from "react";
import { manageStudentCode } from "../../actions";

export function StudentCodeForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(manageStudentCode.bind(null, id), { message: "" });
  return <form className="stack" action={action} autoComplete="off">
    <div className="inline-actions"><button className="button" value="issue" name="intent" disabled={pending}>Cấp mã mới</button>
      <button className="button" value="revoke" name="intent" disabled={pending}>Thu hồi mã</button></div>
    {state.message && <p role="status">{state.message}</p>}
    {state.code && <label>Mã cá nhân<input readOnly value={state.code} onFocus={event => event.currentTarget.select()}/></label>}
  </form>;
}
