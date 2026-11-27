import { createHash, randomBytes } from "node:crypto";

export const newStudentCode = () => randomBytes(15).toString("base64url");
export const studentCodeHash = (code: string) => createHash("sha256").update(code).digest("hex");
