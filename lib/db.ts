import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | undefined;
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  sqlClient ??= neon(url);
  return sqlClient;
}
