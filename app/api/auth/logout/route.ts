import { EMP_LOGIN_CHALLENGE_COOKIE, EMP_SESSION_COOKIE, LEGACY_EMP_SESSION_COOKIE } from "@/lib/internal-auth";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${EMP_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`);
  response.headers.append("Set-Cookie", `${LEGACY_EMP_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`);
  response.headers.append("Set-Cookie", `${EMP_LOGIN_CHALLENGE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`);
  return response;
}
