/** The receipt log's sign-in cookie holds a hash of ADMIN_PASSWORD, never the password itself. */
export const ADMIN_COOKIE = "hg_admin";

export const adminPassword = () => process.env.ADMIN_PASSWORD?.trim() || "";

export async function adminToken(password: string) {
  const data = new TextEncoder().encode(`hopes-grocer:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
