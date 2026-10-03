import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type SesiAdmin = {
  id: string;
  username?: string;
  nama?: string;
};

export async function getSesiAdmin(): Promise<SesiAdmin | null> {
  const token = (await cookies()).get("sakti_token")?.value;
  const secretEnv = process.env.JWT_SECRET;
  if (!token || !secretEnv) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secretEnv),
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "ADMIN_DIRMAWA" || typeof payload.sub !== "string") {
      return null;
    }

    return {
      id: payload.sub,
      username: typeof payload.username === "string" ? payload.username : undefined,
      nama: typeof payload.nama === "string" ? payload.nama : undefined,
    };
  } catch {
    // Token kedaluwarsa, rusak, atau tanda tangan tidak cocok
    return null;
  }
}