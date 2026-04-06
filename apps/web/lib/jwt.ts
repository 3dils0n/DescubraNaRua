import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@repo/shared";

const COOKIE_NAME = "admin_session";

export { COOKIE_NAME };

export type AdminJwtPayload = {
  sub: string;
  email: string;
};

async function secretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signAdminToken(payload: AdminJwtPayload, expiresIn = "7d"): Promise<string> {
  const key = await secretKey();
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const key = await secretKey();
    const { payload } = await jwtVerify(token, key);
    const sub = payload.sub;
    const email = payload.email as string | undefined;
    if (!sub || !email) return null;
    return { sub, email };
  } catch {
    return null;
  }
}
